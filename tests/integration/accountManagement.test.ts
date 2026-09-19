import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';

const app = createApp();
const testEmail = (label: string) => `test-account-${label}-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-account-' } } });
  await prisma.$disconnect();
});

async function registerAndLogin(email: string, password = 'original-pw1') {
  const reg = await request(app).post('/api/auth/register').send({ email, password });
  return { token: reg.body.token as string, userId: reg.body.user.id as string };
}

describe('DELETE /api/scans/:id', () => {
  it('deletes a scan owned by the requester', async () => {
    const email = testEmail('delete-own-scan');
    const { token } = await registerAndLogin(email);

    const scanRes = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });
    const scanId = scanRes.body.id;

    const del = await request(app).delete(`/api/scans/${scanId}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const getAfter = await request(app).get(`/api/scans/${scanId}`).set('Authorization', `Bearer ${token}`);
    expect(getAfter.status).toBe(404);

    await prisma.user.deleteMany({ where: { email } });
  });

  it("cannot delete another user's scan", async () => {
    const emailA = testEmail('victim');
    const emailB = testEmail('attacker');
    const { token: tokenA } = await registerAndLogin(emailA);
    const { token: tokenB } = await registerAndLogin(emailB);

    const scanRes = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });
    const scanId = scanRes.body.id;

    const del = await request(app).delete(`/api/scans/${scanId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(del.status).toBe(404);

    const stillThere = await request(app).get(`/api/scans/${scanId}`).set('Authorization', `Bearer ${tokenA}`);
    expect(stillThere.status).toBe(200);

    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  });

  it('returns 404 for a nonexistent scan id', async () => {
    const email = testEmail('delete-missing');
    const { token } = await registerAndLogin(email);
    const del = await request(app).delete('/api/scans/does-not-exist').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(404);
    await prisma.user.deleteMany({ where: { email } });
  });
});

describe('PATCH /api/auth/change-password', () => {
  it('changes the password given the correct current password', async () => {
    const email = testEmail('change-pw-ok');
    const { token } = await registerAndLogin(email);

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'original-pw1', newPassword: 'brand-new-pw2' });
    expect(res.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email, password: 'original-pw1' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'brand-new-pw2' });
    expect(newLogin.status).toBe(200);

    await prisma.user.deleteMany({ where: { email } });
  });

  it('rejects an incorrect current password', async () => {
    const email = testEmail('change-pw-wrong-current');
    const { token } = await registerAndLogin(email);

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'totally-wrong', newPassword: 'brand-new-pw2' });
    expect(res.status).toBe(401);

    await prisma.user.deleteMany({ where: { email } });
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .send({ currentPassword: 'x', newPassword: 'brand-new-pw2' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/change-email', () => {
  it('changes the email given the correct current password', async () => {
    const email = testEmail('change-email-ok');
    const newEmail = testEmail('change-email-ok-new');
    const { token } = await registerAndLogin(email);

    const res = await request(app)
      .patch('/api/auth/change-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail, currentPassword: 'original-pw1' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(newEmail);

    const loginOld = await request(app).post('/api/auth/login').send({ email, password: 'original-pw1' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post('/api/auth/login').send({ email: newEmail, password: 'original-pw1' });
    expect(loginNew.status).toBe(200);

    await prisma.user.deleteMany({ where: { email: { in: [email, newEmail] } } });
  });

  it('rejects changing to an email already in use by another account', async () => {
    const emailA = testEmail('taken-a');
    const emailB = testEmail('taken-b');
    await registerAndLogin(emailA);
    const { token: tokenB } = await registerAndLogin(emailB);

    const res = await request(app)
      .patch('/api/auth/change-email')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ newEmail: emailA, currentPassword: 'original-pw1' });
    expect(res.status).toBe(409);

    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  });

  it('rejects an incorrect current password', async () => {
    const email = testEmail('change-email-wrong-pw');
    const newEmail = testEmail('change-email-wrong-pw-new');
    const { token } = await registerAndLogin(email);

    const res = await request(app)
      .patch('/api/auth/change-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail, currentPassword: 'wrong-password' });
    expect(res.status).toBe(401);

    await prisma.user.deleteMany({ where: { email } });
  });
});

describe('DELETE /api/auth/account', () => {
  it('deletes the account and cascades its scans/settings given the correct password', async () => {
    const email = testEmail('delete-account-ok');
    const { token, userId } = await registerAndLogin(email);

    await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });

    const del = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'original-pw1' });
    expect(del.status).toBe(200);

    const userGone = await prisma.user.findUnique({ where: { id: userId } });
    expect(userGone).toBeNull();

    const scansGone = await prisma.scan.findMany({ where: { userId } });
    expect(scansGone).toEqual([]);

    // The token should no longer grant access to anything (user row is gone)
    const meAfter = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meAfter.status).toBe(404);
  });

  it('rejects an incorrect password and does not delete the account', async () => {
    const email = testEmail('delete-account-wrong-pw');
    const { token, userId } = await registerAndLogin(email);

    const del = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong-password' });
    expect(del.status).toBe(401);

    const stillExists = await prisma.user.findUnique({ where: { id: userId } });
    expect(stillExists).not.toBeNull();

    await prisma.user.deleteMany({ where: { email } });
  });
});
