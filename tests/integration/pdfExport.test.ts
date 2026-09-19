import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';
import { closePdfBrowser } from '../../lib/pdf';
import { waitForScanStatus } from '../helpers';

const app = createApp();
const testEmail = (label: string) => `test-pdf-${label}-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-pdf-' } } });
  await prisma.$disconnect();
  await closePdfBrowser();
});

describe('GET /api/report/:id/download?format=pdf', () => {
  it('returns a real PDF file for a completed scan', async () => {
    const email = testEmail('real-pdf');
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
    const token = reg.body.token;

    const scanRes = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });
    const scanId = scanRes.body.id;

    await waitForScanStatus(app, scanId, token);

    const res = await request(app)
      .get(`/api/report/${scanId}/download?format=pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('.pdf');

    // A real PDF file always starts with the "%PDF-" magic bytes.
    const body: Buffer = res.body;
    expect(body.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(1000);

    await prisma.user.deleteMany({ where: { email } });
  }, 45000);

  it('still returns HTML by default (no format param)', async () => {
    const email = testEmail('default-html');
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
    const token = reg.body.token;

    const scanRes = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });
    const scanId = scanRes.body.id;

    await waitForScanStatus(app, scanId, token);

    const res = await request(app).get(`/api/report/${scanId}/download`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    await prisma.user.deleteMany({ where: { email } });
  }, 25000);
});
