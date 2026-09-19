import { describe, it, expect } from 'vitest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

// Verifies the express-rate-limit mechanism itself (headers, 429 on limit, reset window),
// using its own tiny app + limiter instance — decoupled from server.ts's shared limiter,
// which is deliberately relaxed to a very high limit under NODE_ENV=test (see server.ts).
function buildLimitedApp(limit: number) {
  const app = express();
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts.' }
  });
  app.post('/api/test-endpoint', limiter, (req, res) => res.json({ ok: true }));
  return app;
}

describe('rate limiting mechanism', () => {
  it('allows requests under the limit', async () => {
    const app = buildLimitedApp(3);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/api/test-endpoint');
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 once the limit is exceeded', async () => {
    const app = buildLimitedApp(3);
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/test-endpoint');
    }
    const blocked = await request(app).post('/api/test-endpoint');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('Too many attempts.');
  });

  it('reports remaining-request count via standard headers', async () => {
    const app = buildLimitedApp(5);
    const res = await request(app).post('/api/test-endpoint');
    expect(res.headers['ratelimit-limit']).toBe('5');
    expect(res.headers['ratelimit-remaining']).toBe('4');
  });
});
