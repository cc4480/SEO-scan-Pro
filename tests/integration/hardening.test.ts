import { describe, it, expect, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';

// These tests check request handling, not crawling: never start a real browser scan.
vi.mock('../../lib/scanRunner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/scanRunner')>();
  return { ...actual, queueScan: vi.fn() };
});

import { createApp } from '../../server';
import { prisma } from '../../lib/db';

const app = createApp();
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const email = (l: string) => `test-hardening-${l}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-hardening-' } } });
  await prisma.$disconnect();
});
afterEach(() => { delete process.env.DAILY_SCAN_LIMIT; delete process.env.SUPPORT_EMAIL; });

describe('API error handling', () => {
  it('answers unknown API routes with JSON 404, not HTML', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error).toBe('Not found');
  });

  it('answers malformed JSON with a 400 instead of a stack trace', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not valid JSON/);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.(ts|js)/);
  });
});

describe('public pages support', () => {
  it('lists the legal pages in the sitemap', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.text).toContain('/terms</loc>');
    expect(res.text).toContain('/privacy</loc>');
  });

  it('exposes the support email only when configured', async () => {
    expect((await request(app).get('/api/public-config')).body.supportEmail).toBeNull();
    process.env.SUPPORT_EMAIL = 'help@example.test';
    expect((await request(app).get('/api/public-config')).body.supportEmail).toBe('help@example.test');
  });
});

describe('daily scan allowance', () => {
  it('refuses a new scan once the account has used its 24-hour allowance', async () => {
    process.env.DAILY_SCAN_LIMIT = '2';
    const reg = await request(app).post('/api/auth/register').send({ email: email('quota'), password: 'original-pw1' });
    const { token, user } = reg.body;
    await prisma.scan.createMany({ data: [
      { url: 'https://8.8.8.8/a', status: 'COMPLETED', userId: user.id },
      { url: 'https://8.8.8.8/b', status: 'COMPLETED', userId: user.id }
    ] });

    const res = await request(app).post('/api/scan').set(auth(token)).send({ url: 'https://8.8.8.8/c' });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('DAILY_LIMIT');
    expect(res.body.error).toMatch(/limit of 2 scans/);
  });

  it('does not count scans older than 24 hours', async () => {
    process.env.DAILY_SCAN_LIMIT = '1';
    const reg = await request(app).post('/api/auth/register').send({ email: email('old'), password: 'original-pw1' });
    const { token, user } = reg.body;
    await prisma.scan.create({ data: { url: 'https://8.8.8.8/old', status: 'COMPLETED', userId: user.id, createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });

    const res = await request(app).post('/api/scan').set(auth(token)).send({ url: 'https://8.8.8.8/new' });
    expect(res.status).toBe(202);
    expect(res.body.code).not.toBe('DAILY_LIMIT');
  });
});
