import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';

const app = createApp();

const testEmail = (label: string) => `test-auth-${label}-${Date.now()}@example.com`;

async function cleanupUser(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-auth-' } } });
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token + user object (no password)', async () => {
    const email = testEmail('register-ok');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.password).toBeUndefined();

    await cleanupUser(email);
  });

  it('auto-provisions white-label settings for the new user', async () => {
    const email = testEmail('register-settings');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    const settingsRes = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body.agencyName).toBe('SEO Scan Elite');

    await cleanupUser(email);
  });

  it('rejects a duplicate email with 409', async () => {
    const email = testEmail('duplicate');
    await request(app).post('/api/auth/register').send({ email, password: 'password123' });

    const second = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
    expect(second.status).toBe(409);

    await cleanupUser(email);
  });

  it('rejects a weak password before ever touching the database', async () => {
    const email = testEmail('weak-password');
    const res = await request(app).post('/api/auth/register').send({ email, password: 'short' });
    expect(res.status).toBe(400);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeNull();
  });

  it('rejects a malformed email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const email = testEmail('login-flow');

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({ email, password: 'correct-password1' });
  });

  afterAll(async () => {
    await cleanupUser(email);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'correct-password1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
  });

  it('rejects an incorrect password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects a nonexistent email with 401 (not 404 — avoids user enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody-here@example.com', password: 'whatever1' });
    expect(res.status).toBe(401);
  });
});

describe('Protected routes reject missing/invalid tokens', () => {
  it('GET /api/scans without a token returns 401', async () => {
    const res = await request(app).get('/api/scans');
    expect(res.status).toBe(401);
  });

  it('GET /api/scans with a garbage token returns 401', async () => {
    const res = await request(app).get('/api/scans').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me without a token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Data isolation between users', () => {
  it("one user's scans are never visible to another user", async () => {
    const emailA = testEmail('isolation-a');
    const emailB = testEmail('isolation-b');

    const regA = await request(app).post('/api/auth/register').send({ email: emailA, password: 'password123' });
    const regB = await request(app).post('/api/auth/register').send({ email: emailB, password: 'password123' });

    await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${regA.body.token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });

    const scansForB = await request(app)
      .get('/api/scans')
      .set('Authorization', `Bearer ${regB.body.token}`);

    expect(scansForB.status).toBe(200);
    expect(scansForB.body).toEqual([]);

    await cleanupUser(emailA);
    await cleanupUser(emailB);
  });
});
