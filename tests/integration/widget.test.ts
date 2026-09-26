import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';
import { waitForScanStatus } from '../helpers';

const app = createApp();
const testEmail = (label: string) => `test-widget-${label}-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-widget-' } } });
  await prisma.$disconnect();
});

describe('POST /api/widget/scan', () => {
  it('rejects a request with no widgetKey (schema validation)', async () => {
    const res = await request(app).post('/api/widget/scan').send({ url: 'example.com', email: 'lead@prospect.com' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown widgetKey with 404', async () => {
    const res = await request(app)
      .post('/api/widget/scan')
      .send({ url: 'example.com', email: 'lead@prospect.com', widgetKey: 'totally-made-up-key' });
    expect(res.status).toBe(404);
  });

  it('attributes the resulting scan to the correct account, not an arbitrary one', async () => {
    const emailA = testEmail('owner-a');
    const emailB = testEmail('owner-b');

    const regA = await request(app).post('/api/auth/register').send({ email: emailA, password: 'password123' });
    const regB = await request(app).post('/api/auth/register').send({ email: emailB, password: 'password123' });

    const meA = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${regA.body.token}`);
    const widgetKeyA = meA.body.widgetKey;
    expect(widgetKeyA).toBeTypeOf('string');

    const widgetRes = await request(app)
      .post('/api/widget/scan')
      .send({ url: 'example.com', email: 'lead@prospect.com', name: 'A Lead', widgetKey: widgetKeyA });

    expect(widgetRes.status).toBe(202);
    const scanId = widgetRes.body.scanId;

    const scan = await prisma.scan.findUnique({ where: { id: scanId } });
    expect(scan?.userId).toBe(regA.body.user.id);
    expect(scan?.userId).not.toBe(regB.body.user.id);
    expect(scan?.leadEmail).toBe('lead@prospect.com');

    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  });

  it('two different accounts get two different widget keys', async () => {
    const emailA = testEmail('unique-a');
    const emailB = testEmail('unique-b');

    const regA = await request(app).post('/api/auth/register').send({ email: emailA, password: 'password123' });
    const regB = await request(app).post('/api/auth/register').send({ email: emailB, password: 'password123' });

    const meA = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${regA.body.token}`);
    const meB = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${regB.body.token}`);

    expect(meA.body.widgetKey).not.toBe(meB.body.widgetKey);

    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  });
});

describe('GET /api/report/:id/download — public vs owner-only access', () => {
  it('a widget-originated (lead) scan report is downloadable without auth once completed', async () => {
    const email = testEmail('download-lead');
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`);

    const widgetRes = await request(app)
      .post('/api/widget/scan')
      .send({ url: 'example.com', email: 'lead@prospect.com', widgetKey: me.body.widgetKey });
    const scanId = widgetRes.body.scanId;

    await waitForScanStatus(app, scanId, reg.body.token);

    const downloadRes = await request(app).get(`/api/report/${scanId}/download`);
    expect(downloadRes.status).toBe(200);

    await prisma.user.deleteMany({ where: { email } });
  }, 25000);

  it("an owner-run scan (no leadEmail) is NOT downloadable without auth", async () => {
    const email = testEmail('download-owner');
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });

    const scanRes = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });
    const scanId = scanRes.body.id;

    await waitForScanStatus(app, scanId, reg.body.token);

    const unauthedDownload = await request(app).get(`/api/report/${scanId}/download`);
    expect(unauthedDownload.status).toBe(401);

    const authedDownload = await request(app)
      .get(`/api/report/${scanId}/download`)
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(authedDownload.status).toBe(200);

    await prisma.user.deleteMany({ where: { email } });
  }, 25000);
});

describe('GET /api/widget/scan/:id — public status, lead scans only', () => {
  it('reports status, score and summary for a lead scan once the async run completes', async () => {
    const email = testEmail('status-lead');
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`);

    const widgetRes = await request(app)
      .post('/api/widget/scan')
      .send({ url: 'example.com', email: 'lead@prospect.com', widgetKey: me.body.widgetKey });
    const scanId = widgetRes.body.scanId;

    // Reachable immediately (no auth) while the crawl/AI pass is still running — this is
    // exactly what the embeddable widget polls.
    const pending = await request(app).get(`/api/widget/scan/${scanId}`);
    expect(pending.status).toBe(200);
    expect(['PENDING', 'COMPLETED']).toContain(pending.body.status);

    await waitForScanStatus(app, scanId, reg.body.token);

    const done = await request(app).get(`/api/widget/scan/${scanId}`);
    expect(done.status).toBe(200);
    expect(done.body.status).toBe('COMPLETED');
    // The widget renders these three fields directly — they must exist, not be undefined.
    expect(typeof done.body.score).toBe('number');
    expect(typeof done.body.criticalIssuesCount).toBe('number');
    expect(done.body.executiveSummary).toBeTypeOf('string');

    await prisma.user.deleteMany({ where: { email } });
  }, 25000);

  it('never exposes an owner-run scan (no leadEmail) even though ids are valid', async () => {
    const email = testEmail('status-owner');
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });

    const scanRes = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });
    const scanId = scanRes.body.id;

    const res = await request(app).get(`/api/widget/scan/${scanId}`);
    expect(res.status).toBe(404);

    await prisma.user.deleteMany({ where: { email } });
  }, 25000);

  it('returns 404 for an unknown scan id', async () => {
    const res = await request(app).get('/api/widget/scan/not-a-real-scan-id');
    expect(res.status).toBe(404);
  });
});
