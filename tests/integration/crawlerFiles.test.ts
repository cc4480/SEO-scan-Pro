import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';

const app = createApp();

describe('robots.txt and sitemap.xml', () => {
  it('serves robots.txt that hides the API and the widget frame and points at the sitemap', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('Disallow: /api/');
    expect(res.text).toContain('Disallow: /embed');
    expect(res.text).toMatch(/Sitemap: \S+\/sitemap\.xml/);
  });

  it('serves a sitemap.xml built from APP_URL', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
    expect(res.text).toContain(`<loc>${process.env.APP_URL!.replace(/\/+$/, '')}/</loc>`);
  });
});

describe('framing', () => {
  it('refuses framing of the API but leaves /embed frameable', async () => {
    const api = await request(app).get('/api/health');
    expect(api.headers['x-frame-options']).toBe('DENY');
    const embed = await request(app).get('/embed');
    expect(embed.headers['x-frame-options']).toBeUndefined();
  });
});
