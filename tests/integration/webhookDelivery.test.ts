import { describe, it, expect, afterAll } from 'vitest';
import http from 'http';
import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '../../server';
import { prisma } from '../../lib/db';
import { waitForScanStatus } from '../helpers';

const app = createApp();
const testEmail = (label: string) => `test-webhook-${label}-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-webhook-' } } });
  await prisma.$disconnect();
});

// Spins up a real local HTTP server to receive the webhook, so this test exercises the
// actual delivery path (real fetch call, real signature header) rather than mocking it.
function startReceiver(): Promise<{ url: string; getRequests: () => any[]; close: () => Promise<void> }> {
  const received: any[] = [];
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        received.push({
          headers: req.headers,
          rawBody: body,
          json: body ? JSON.parse(body) : null
        });
        res.writeHead(200);
        res.end('ok');
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        getRequests: () => received,
        close: () => new Promise((res) => server.close(() => res()))
      });
    });
  });
}

describe('Webhook delivery on widget lead capture', () => {
  it('fires a correctly signed webhook to the configured URL when a widget scan completes', async () => {
    const receiver = await startReceiver();
    const email = testEmail('delivery');

    try {
      const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
      const token = reg.body.token;

      // Configure this account's webhook URL
      await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ webhookUrl: receiver.url });

      const settingsRes = await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);
      const webhookSecret = settingsRes.body.webhookSecret;
      expect(webhookSecret).toBeTypeOf('string');

      const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      const widgetRes = await request(app)
        .post('/api/widget/scan')
        .send({ url: 'example.com', email: 'lead@prospect.com', name: 'A Lead', widgetKey: me.body.widgetKey });

      // Wait for the async scan pipeline to finish — the webhook fires right after
      await waitForScanStatus(app, widgetRes.body.scanId, token);
      // Webhook delivery itself is a separate fire-and-forget fetch after that; give it a moment.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const requests = receiver.getRequests();
      expect(requests.length).toBe(1);

      const [received] = requests;
      expect(received.json.event).toBe('seo_lead_captured');
      expect(received.json.leadEmail).toBe('lead@prospect.com');
      expect(received.json.targetUrl).toBe('example.com');

      const expectedSignature = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(received.rawBody).digest('hex');
      expect(received.headers['x-seoscan-signature']).toBe(expectedSignature);
    } finally {
      await receiver.close();
      await prisma.user.deleteMany({ where: { email } });
    }
  }, 30000);

  it('does not fire a webhook for a non-widget (owner-run) scan', async () => {
    const receiver = await startReceiver();
    const email = testEmail('no-fire-owner');

    try {
      const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
      const token = reg.body.token;

      await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ webhookUrl: receiver.url });

      const scanRes = await request(app)
        .post('/api/scan')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'example.com', mode: 'SINGLE', depth: 1 });

      await waitForScanStatus(app, scanRes.body.id, token);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(receiver.getRequests().length).toBe(0);
    } finally {
      await receiver.close();
      await prisma.user.deleteMany({ where: { email } });
    }
  }, 30000);
});
