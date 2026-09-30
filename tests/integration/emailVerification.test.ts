import { describe, it, expect, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';

const app = createApp();
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const email = (l: string) => `test-verify-${l}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-verify-' } } });
  await prisma.$disconnect();
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  vi.unstubAllGlobals();
});

function withProvider() {
  process.env.RESEND_API_KEY = 're_test';
  process.env.EMAIL_FROM = 'noreply@example.test';
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Pulls the confirmation token out of the most recent email sent through the mocked provider.
function lastToken(fetchMock: ReturnType<typeof vi.fn>): string {
  const calls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('api.resend.com'));
  const body = JSON.parse(calls[calls.length - 1][1].body);
  return /verifyToken=([a-f0-9]+)/.exec(body.text)![1];
}

describe('email verification', () => {
  it('gates scans until the emailed link is used, then unlocks them', async () => {
    const fetchMock = withProvider();
    const e = email('flow');
    const reg = await request(app).post('/api/auth/register').send({ email: e, password: 'original-pw1' });
    expect(reg.body.user.emailVerified).toBe(false);
    const token = reg.body.token;

    const blocked = await request(app).post('/api/scan').set(auth(token)).send({ url: 'https://example.com' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect((await request(app).get('/api/auth/me').set(auth(token))).body.emailVerified).toBe(false);

    const link = lastToken(fetchMock);
    expect((await request(app).post('/api/auth/verify-email').send({ token: link })).status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth(token))).body.emailVerified).toBe(true);

    const after = await request(app).post('/api/scan').set(auth(token)).send({ url: 'https://example.com' });
    expect(after.status).not.toBe(403);

    // Links are single use.
    expect((await request(app).post('/api/auth/verify-email').send({ token: link })).status).toBe(400);
  });

  it('rejects unknown and expired links', async () => {
    const fetchMock = withProvider();
    const reg = await request(app).post('/api/auth/register').send({ email: email('bad'), password: 'original-pw1' });
    expect((await request(app).post('/api/auth/verify-email').send({ token: 'nope' })).status).toBe(400);

    await prisma.emailVerificationToken.updateMany({ where: { userId: reg.body.user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await request(app).post('/api/auth/verify-email').send({ token: lastToken(fetchMock) })).status).toBe(400);
  });

  it('resend replaces the old link', async () => {
    const fetchMock = withProvider();
    const reg = await request(app).post('/api/auth/register').send({ email: email('resend'), password: 'original-pw1' });
    const first = lastToken(fetchMock);
    expect((await request(app).post('/api/auth/resend-verification').set(auth(reg.body.token))).status).toBe(200);
    const second = lastToken(fetchMock);
    expect(second).not.toBe(first);
    expect((await request(app).post('/api/auth/verify-email').send({ token: first })).status).toBe(400);
    expect((await request(app).post('/api/auth/verify-email').send({ token: second })).status).toBe(200);
  });

  it('a link for the old address cannot verify a changed address, and change-email un-verifies', async () => {
    const fetchMock = withProvider();
    const reg = await request(app).post('/api/auth/register').send({ email: email('chg'), password: 'original-pw1' });
    await request(app).post('/api/auth/verify-email').send({ token: lastToken(fetchMock) });

    const newEmail = email('chg-new');
    const res = await request(app).patch('/api/auth/change-email').set(auth(reg.body.token)).send({ newEmail, currentPassword: 'original-pw1' });
    expect(res.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth(reg.body.token))).body.emailVerified).toBe(false);
    expect((await request(app).post('/api/auth/verify-email').send({ token: lastToken(fetchMock) })).status).toBe(200);
  });

  it('does not gate anything when no email provider is configured', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: email('noprov'), password: 'original-pw1' });
    expect(reg.body.user.emailVerified).toBe(true);
    const res = await request(app).post('/api/scan').set(auth(reg.body.token)).send({ url: 'https://example.com' });
    expect(res.status).not.toBe(403);
  });
});
