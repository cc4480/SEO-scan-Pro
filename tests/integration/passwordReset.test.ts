import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';

const app = createApp();
const testEmail = (label: string) => `test-reset-${label}-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-reset-' } } });
  await prisma.$disconnect();
});

describe('POST /api/auth/forgot-password', () => {
  it('returns a generic message and a devResetLink for a real account (test/dev env)', async () => {
    const email = testEmail('real-account');
    await request(app).post('/api/auth/register').send({ email, password: 'original-pw1' });

    const res = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account with that email exists/i);
    expect(res.body.devResetLink).toContain('resetToken=');

    await prisma.user.deleteMany({ where: { email } });
  });

  it('returns the same generic message for a nonexistent email (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody-at-all@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account with that email exists/i);
    expect(res.body.devResetLink).toBeUndefined();
  });

  it('rejects a malformed email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('changes the password given a valid token, and the old password stops working', async () => {
    const email = testEmail('full-flow');
    await request(app).post('/api/auth/register').send({ email, password: 'original-pw1' });

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = new URL(forgotRes.body.devResetLink).searchParams.get('resetToken');
    expect(token).toBeTruthy();

    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'brand-new-pw2' });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email, password: 'original-pw1' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'brand-new-pw2' });
    expect(newLogin.status).toBe(200);

    await prisma.user.deleteMany({ where: { email } });
  });

  it('rejects a garbage/unknown token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'totally-made-up', password: 'whatever12' });
    expect(res.status).toBe(400);
  });

  it('rejects reusing an already-used token', async () => {
    const email = testEmail('reuse');
    await request(app).post('/api/auth/register').send({ email, password: 'original-pw1' });

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = new URL(forgotRes.body.devResetLink).searchParams.get('resetToken');

    const first = await request(app).post('/api/auth/reset-password').send({ token, password: 'first-new-pw2' });
    expect(first.status).toBe(200);

    const second = await request(app).post('/api/auth/reset-password').send({ token, password: 'second-new-pw3' });
    expect(second.status).toBe(400);

    await prisma.user.deleteMany({ where: { email } });
  });

  it('requesting a new reset invalidates the previous outstanding token', async () => {
    const email = testEmail('invalidate-prior');
    await request(app).post('/api/auth/register').send({ email, password: 'original-pw1' });

    const firstForgot = await request(app).post('/api/auth/forgot-password').send({ email });
    const firstToken = new URL(firstForgot.body.devResetLink).searchParams.get('resetToken');

    // Second request should invalidate the first token
    await request(app).post('/api/auth/forgot-password').send({ email });

    const attemptWithStaleToken = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: firstToken, password: 'whatever-new-pw2' });
    expect(attemptWithStaleToken.status).toBe(400);

    await prisma.user.deleteMany({ where: { email } });
  });

  it('rejects a weak new password', async () => {
    const email = testEmail('weak-new-pw');
    await request(app).post('/api/auth/register').send({ email, password: 'original-pw1' });
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = new URL(forgotRes.body.devResetLink).searchParams.get('resetToken');

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'short' });
    expect(res.status).toBe(400);

    await prisma.user.deleteMany({ where: { email } });
  });
});
