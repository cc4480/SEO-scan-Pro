import { describe, it, expect, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';

// Scheduler tests must not launch a real browser crawl: capture what would have been queued.
vi.mock('../../lib/scanRunner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/scanRunner')>();
  return { ...actual, queueScan: vi.fn() };
});

import { createApp } from '../../server';
import { prisma } from '../../lib/db';
import { queueScan, recoverStuckScans, runScan } from '../../lib/scanRunner';
import { openProgress } from '../../lib/progress';
import { runDueMonitors } from '../../lib/scheduler';
import { evaluateMonitorAlert } from '../../lib/alerts';

const app = createApp();
const testEmail = (label: string) => `test-platform-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test-platform-' } } });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.mocked(queueScan).mockClear();
  delete process.env.MAX_PENDING_SCANS;
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  vi.unstubAllGlobals();
});

async function signUp(label: string, password = 'original-pw1') {
  const email = testEmail(label);
  const reg = await request(app).post('/api/auth/register').send({ email, password });
  return { email, password, token: reg.body.token as string, userId: reg.body.user.id as string };
}
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// Inserts a finished scan directly, bypassing the crawler.
async function seedScan(userId: string, over: Record<string, any> = {}) {
  return prisma.scan.create({
    data: {
      url: 'https://seed.test',
      status: 'COMPLETED',
      userId,
      seoReport: { score: { overall: 80, technical: 70, content: 60, aeoGeo: 50, performance: 90 }, criticalIssues: ['issue A'] },
      crawlData: { hasSimulatedData: false },
      ...over
    }
  });
}

describe('session revocation', () => {
  it('logout-all kills every older token and hands back a working one', async () => {
    const u = await signUp('logout-all');
    const other = (await request(app).post('/api/auth/login').send({ email: u.email, password: u.password })).body.token;

    const res = await request(app).post('/api/auth/logout-all').set(auth(u.token));
    expect(res.status).toBe(200);

    expect((await request(app).get('/api/auth/me').set(auth(u.token))).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth(other))).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth(res.body.token))).status).toBe(200);
  });

  it('changing the password revokes old tokens but keeps the current tab signed in', async () => {
    const u = await signUp('pw-revoke');
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set(auth(u.token))
      .send({ currentPassword: u.password, newPassword: 'brand-new-pw2' });
    expect(res.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth(u.token))).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth(res.body.token))).status).toBe(200);
  });

  it('a password reset revokes existing sessions', async () => {
    const u = await signUp('reset-revoke');
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: u.email });
    const token = new URL(forgot.body.devResetLink).searchParams.get('resetToken');
    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'after-reset-pw3' });
    expect(reset.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth(u.token))).status).toBe(401);
  });
});

describe('API keys', () => {
  it('creates a key shown once, authenticates with it, and never lists the plaintext', async () => {
    const u = await signUp('apikey');
    const created = await request(app).post('/api/api-keys').set(auth(u.token)).send({ name: 'CI' });
    expect(created.status).toBe(201);
    expect(created.body.key).toMatch(/^ssp_/);

    const list = await request(app).get('/api/api-keys').set(auth(u.token));
    expect(list.body).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toContain(created.body.key);
    expect(list.body[0].prefix).toBe(created.body.key.slice(0, 8));

    // Works on ordinary data routes
    const me = await request(app).get('/api/scans').set(auth(created.body.key));
    expect(me.status).toBe(200);
    // ...and records use
    const after = await request(app).get('/api/api-keys').set(auth(u.token));
    await vi.waitFor(async () => {
      const again = await request(app).get('/api/api-keys').set(auth(u.token));
      expect(again.body[0].lastUsedAt).not.toBeNull();
    });
    expect(after.status).toBe(200);
  });

  it('cannot be used for account management or minting more keys', async () => {
    const u = await signUp('apikey-scope');
    const { key } = (await request(app).post('/api/api-keys').set(auth(u.token)).send({ name: 'k' })).body;

    expect((await request(app).post('/api/api-keys').set(auth(key)).send({ name: 'x' })).status).toBe(403);
    expect((await request(app).post('/api/auth/logout-all').set(auth(key))).status).toBe(403);
    expect((await request(app).patch('/api/auth/change-password').set(auth(key)).send({ currentPassword: u.password, newPassword: 'zzzzzzz9' })).status).toBe(403);
    expect((await request(app).delete('/api/auth/account').set(auth(key)).send({ currentPassword: u.password })).status).toBe(403);
  });

  it('stops working once revoked, and only the owner can revoke it', async () => {
    const a = await signUp('apikey-owner');
    const b = await signUp('apikey-other');
    const { id, key } = (await request(app).post('/api/api-keys').set(auth(a.token)).send({ name: 'k' })).body;

    expect((await request(app).delete(`/api/api-keys/${id}`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).get('/api/scans').set(auth(key))).status).toBe(200);
    expect((await request(app).delete(`/api/api-keys/${id}`).set(auth(a.token))).status).toBe(200);
    expect((await request(app).get('/api/scans').set(auth(key))).status).toBe(401);
  });

  it('rejects an unknown ssp_ key and a missing name', async () => {
    const u = await signUp('apikey-bad');
    expect((await request(app).get('/api/scans').set(auth('ssp_doesnotexist'))).status).toBe(401);
    expect((await request(app).post('/api/api-keys').set(auth(u.token)).send({})).status).toBe(400);
  });

  it('a key belongs to its user: it cannot read another account\'s scans', async () => {
    const a = await signUp('apikey-iso-a');
    const b = await signUp('apikey-iso-b');
    const scan = await seedScan(a.userId);
    const { key } = (await request(app).post('/api/api-keys').set(auth(b.token)).send({ name: 'k' })).body;
    expect((await request(app).get(`/api/scans/${scan.id}`).set(auth(key))).status).toBe(404);
  });
});

describe('scan list filters, export and leads', () => {
  it('filters by search text, status and leads-only, scoped to the caller', async () => {
    const a = await signUp('filter-a');
    const b = await signUp('filter-b');
    await seedScan(a.userId, { url: 'https://alpha.test' });
    await seedScan(a.userId, { url: 'https://beta.test', status: 'FAILED', seoReport: undefined });
    await seedScan(a.userId, { url: 'https://gamma.test', leadEmail: 'lead@x.test', leadName: 'Lee' });
    await seedScan(b.userId, { url: 'https://alpha-other.test' });

    const list = (q: string) => request(app).get(`/api/scans${q}`).set(auth(a.token));
    expect((await list('')).body).toHaveLength(3);
    expect((await list('?q=ALPHA')).body.map((s: any) => s.url)).toEqual(['https://alpha.test']);
    expect((await list('?status=FAILED')).body.map((s: any) => s.url)).toEqual(['https://beta.test']);
    const leads = await list('?leads=true');
    expect(leads.body.map((s: any) => s.url)).toEqual(['https://gamma.test']);
    expect(leads.headers['x-total-count']).toBe('1');
    expect((await list('?status=BOGUS')).status).toBe(400);
  });

  it('exports CSV (with formula injection neutralised) and JSON', async () => {
    const u = await signUp('export');
    await seedScan(u.userId, { url: 'https://csv.test', leadEmail: 'x@y.test', leadName: '=EVIL()' });

    const csv = await request(app).get('/api/scans/export?format=csv').set(auth(u.token));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('seo_scans.csv');
    expect(csv.text).toContain('https://csv.test');
    expect(csv.text).toContain("'=EVIL()");
    expect(csv.text).not.toMatch(/,=EVIL/);

    const json = await request(app).get('/api/scans/export?format=json').set(auth(u.token));
    expect(json.body).toHaveLength(1);
    expect(json.body[0]).toMatchObject({ url: 'https://csv.test', overall: 80, leadEmail: 'x@y.test' });

    expect((await request(app).get('/api/scans/export')).status).toBe(401);
  });

  it('does not mistake "export" for a scan id', async () => {
    const u = await signUp('export-route');
    const res = await request(app).get('/api/scans/export').set(auth(u.token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('lists leads for the owner only', async () => {
    const a = await signUp('leads-a');
    const b = await signUp('leads-b');
    await seedScan(a.userId, { leadEmail: 'prospect@x.test', leadName: 'Pat' });
    await seedScan(a.userId); // owner-run, not a lead
    await seedScan(b.userId, { leadEmail: 'someone-else@x.test' });

    const res = await request(app).get('/api/leads').set(auth(a.token));
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ email: 'prospect@x.test', name: 'Pat', overallScore: 80, criticalIssuesCount: 1 });
    expect(res.headers['x-total-count']).toBe('1');
  });
});

describe('scan backlog cap and startup recovery', () => {
  it('returns 429 once the account has too many PENDING scans', async () => {
    process.env.MAX_PENDING_SCANS = '2';
    const u = await signUp('cap');
    await seedScan(u.userId, { status: 'PENDING' });
    await seedScan(u.userId, { status: 'PENDING' });
    const res = await request(app).post('/api/scan').set(auth(u.token)).send({ url: 'example.com' });
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/in progress/);
  });

  it('does not count another user\'s backlog', async () => {
    process.env.MAX_PENDING_SCANS = '1';
    const a = await signUp('cap-a');
    const b = await signUp('cap-b');
    await seedScan(a.userId, { status: 'PENDING' });
    const res = await request(app).post('/api/scan').set(auth(b.token)).send({ url: 'example.com' });
    expect(res.status).toBe(202);
    expect(queueScan).toHaveBeenCalledTimes(1);
  });

  it('recoverStuckScans marks orphaned PENDING scans FAILED and leaves finished ones alone', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const u = await signUp('recover');
    const stuck = await seedScan(u.userId, { status: 'PENDING' });
    const done = await seedScan(u.userId, { status: 'COMPLETED' });
    await recoverStuckScans();
    expect((await prisma.scan.findUnique({ where: { id: stuck.id } }))?.status).toBe('FAILED');
    expect((await prisma.scan.findUnique({ where: { id: done.id } }))?.status).toBe('COMPLETED');
  });
});

describe('monitors', () => {
  it('creates, lists, updates and deletes a monitor, scoped to its owner', async () => {
    const a = await signUp('mon-a');
    const b = await signUp('mon-b');

    const created = await request(app).post('/api/monitors').set(auth(a.token)).send({ url: 'example.com', frequency: 'DAILY', alertDrop: 8 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ url: 'example.com', frequency: 'DAILY', alertDrop: 8, active: true });
    const id = created.body.id;

    expect((await request(app).get('/api/monitors').set(auth(a.token))).body).toHaveLength(1);
    expect((await request(app).get('/api/monitors').set(auth(b.token))).body).toHaveLength(0);
    expect((await request(app).patch(`/api/monitors/${id}`).set(auth(b.token)).send({ active: false })).status).toBe(404);
    expect((await request(app).delete(`/api/monitors/${id}`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).get(`/api/monitors/${id}/history`).set(auth(b.token))).status).toBe(404);

    const paused = await request(app).patch(`/api/monitors/${id}`).set(auth(a.token)).send({ active: false, alertDrop: 12 });
    expect(paused.body).toMatchObject({ active: false, alertDrop: 12 });

    expect((await request(app).delete(`/api/monitors/${id}`).set(auth(a.token))).status).toBe(200);
    expect((await request(app).get('/api/monitors').set(auth(a.token))).body).toHaveLength(0);
  });

  it('validates input and refuses private-address URLs', async () => {
    const u = await signUp('mon-validate');
    expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'example.com', frequency: 'HOURLY' })).status).toBe(400);
    expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'example.com', alertDrop: 0 })).status).toBe(400);
    expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'http://127.0.0.1/' })).status).toBe(400);
    expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'http://169.254.169.254/' })).status).toBe(400);
  });

  it('caps monitors at 10 per account', async () => {
    const u = await signUp('mon-cap');
    await prisma.monitor.createMany({ data: Array.from({ length: 10 }, (_, i) => ({ url: `https://m${i}.test`, userId: u.userId })) });
    const res = await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at most 10/);
  });

  it('returns score history oldest-first, flagging simulated points', async () => {
    const u = await signUp('mon-history');
    const monitor = await prisma.monitor.create({ data: { url: 'https://h.test', userId: u.userId } });
    const t = (n: number) => new Date(Date.UTC(2026, 0, n));
    await seedScan(u.userId, { monitorId: monitor.id, createdAt: t(3), seoReport: { score: { overall: 60 }, criticalIssues: [] } });
    await seedScan(u.userId, { monitorId: monitor.id, createdAt: t(1), seoReport: { score: { overall: 80 }, criticalIssues: ['a'] } });
    await seedScan(u.userId, { monitorId: monitor.id, createdAt: t(2), crawlData: { hasSimulatedData: true } });
    await seedScan(u.userId, { monitorId: monitor.id, status: 'FAILED', createdAt: t(4) });

    const res = await request(app).get(`/api/monitors/${monitor.id}/history`).set(auth(u.token));
    expect(res.status).toBe(200);
    expect(res.body.map((p: any) => p.overall)).toEqual([80, 80, 60]);
    expect(res.body.map((p: any) => p.simulated)).toEqual([false, true, false]);
    expect(res.body[0].criticalIssuesCount).toBe(1);

    const list = await request(app).get('/api/monitors').set(auth(u.token));
    expect(list.body[0].latestScore).toBe(60);
  });
});

describe('scheduler', () => {
  it('starts a scan for each due active monitor exactly once and reschedules it', async () => {
    const u = await signUp('sched');
    const now = new Date('2026-06-01T12:00:00Z');
    const due = await prisma.monitor.create({ data: { url: 'https://due.test', userId: u.userId, frequency: 'DAILY', nextRunAt: new Date('2026-06-01T00:00:00Z') } });
    const later = await prisma.monitor.create({ data: { url: 'https://later.test', userId: u.userId, nextRunAt: new Date('2026-06-05T00:00:00Z') } });
    const paused = await prisma.monitor.create({ data: { url: 'https://paused.test', userId: u.userId, active: false, nextRunAt: new Date('2026-06-01T00:00:00Z') } });

    const started = await runDueMonitors(now);
    expect(started).toBe(1);
    expect(queueScan).toHaveBeenCalledTimes(1);
    expect(vi.mocked(queueScan).mock.calls[0].slice(1)).toEqual(['https://due.test', 'SINGLE', 1, u.userId]);

    const scan = await prisma.scan.findFirst({ where: { monitorId: due.id } });
    expect(scan).toMatchObject({ status: 'PENDING', userId: u.userId, url: 'https://due.test' });

    const after = await prisma.monitor.findUnique({ where: { id: due.id } });
    expect(after?.lastRunAt?.toISOString()).toBe(now.toISOString());
    expect(after?.nextRunAt.toISOString()).toBe('2026-06-02T12:00:00.000Z');

    // A second tick at the same time finds nothing due: no double-run.
    expect(await runDueMonitors(now)).toBe(0);
    expect(await prisma.scan.count({ where: { monitorId: later.id } })).toBe(0);
    expect(await prisma.scan.count({ where: { monitorId: paused.id } })).toBe(0);
  });
});

describe('monitor alerts', () => {
  async function setup(opts: { enableEmailAlerts: boolean; previousScore: number; currentScore: number; previousSim?: boolean; currentSim?: boolean }) {
    const u = await signUp('alert');
    await request(app).get('/api/settings').set(auth(u.token)); // ensures settings row exists
    await prisma.whiteLabelSettings.upsert({
      where: { userId: u.userId },
      update: { enableEmailAlerts: opts.enableEmailAlerts, monitoringEmail: 'ops@agency.test' },
      create: { userId: u.userId, enableEmailAlerts: opts.enableEmailAlerts, monitoringEmail: 'ops@agency.test' }
    });
    const monitor = await prisma.monitor.create({ data: { url: 'https://a.test', userId: u.userId, alertDrop: 5 } });
    await seedScan(u.userId, {
      monitorId: monitor.id, createdAt: new Date('2026-01-01'), url: 'https://a.test',
      seoReport: { score: { overall: opts.previousScore }, criticalIssues: ['old'] },
      crawlData: { hasSimulatedData: !!opts.previousSim }
    });
    const current = await seedScan(u.userId, {
      monitorId: monitor.id, createdAt: new Date('2026-01-08'), url: 'https://a.test',
      seoReport: { score: { overall: opts.currentScore }, criticalIssues: ['old', 'brand new problem'] },
      crawlData: { hasSimulatedData: !!opts.currentSim }
    });
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'alerts@example.test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    return { scanId: current.id, fetchMock };
  }

  it('emails the monitoring address when the score falls past the threshold', async () => {
    const { scanId, fetchMock } = await setup({ enableEmailAlerts: true, previousScore: 90, currentScore: 70 });
    expect(await evaluateMonitorAlert(scanId)).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['ops@agency.test']);
    expect(body.subject).toContain('dropped 20 points');
    expect(body.text).toContain('brand new problem');
    expect(body.text).not.toMatch(/- old\b/);
  });

  it('stays quiet when alerts are off, the drop is small, or either scan used simulated data', async () => {
    let s = await setup({ enableEmailAlerts: false, previousScore: 90, currentScore: 70 });
    expect(await evaluateMonitorAlert(s.scanId)).toBe(false);
    expect(s.fetchMock).not.toHaveBeenCalled();

    s = await setup({ enableEmailAlerts: true, previousScore: 90, currentScore: 88 });
    expect(await evaluateMonitorAlert(s.scanId)).toBe(false);

    s = await setup({ enableEmailAlerts: true, previousScore: 90, currentScore: 40, currentSim: true });
    expect(await evaluateMonitorAlert(s.scanId)).toBe(false);

    s = await setup({ enableEmailAlerts: true, previousScore: 90, currentScore: 40, previousSim: true });
    expect(await evaluateMonitorAlert(s.scanId)).toBe(false);
    expect(s.fetchMock).not.toHaveBeenCalled();
  });

  it('does nothing for a scan that did not come from a monitor', async () => {
    const u = await signUp('alert-plain');
    const scan = await seedScan(u.userId);
    expect(await evaluateMonitorAlert(scan.id)).toBe(false);
  });
});

describe('password reset email', () => {
  it('sends the reset link to the account email through the provider', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'noreply@example.test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    const u = await signUp('reset-mail');
    await request(app).post('/api/auth/forgot-password').send({ email: u.email });

    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes('api.resend.com'));
    expect(call).toBeTruthy();
    const body = JSON.parse(call![1].body);
    expect(body.to).toEqual([u.email]);
    expect(body.text).toContain('resetToken=');
  });
});

describe('deployment behaviour', () => {
  it('health check touches the database and reports ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('health check answers 503 when the database is unreachable', async () => {
    const spy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('connection refused') as never);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    spy.mockRestore();
  });

  it('trusts exactly one proxy hop, so a forged X-Forwarded-For prefix cannot pick the client IP', async () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});

describe('live audit log endpoint', () => {
  it('streams real events for a running scan, only the new ones when ?after= is given', async () => {
    const u = await signUp('events-live');
    const scan = await seedScan(u.userId, { status: 'PENDING', seoReport: undefined, crawlData: undefined });
    const p = openProgress(scan.id, u.userId);
    p.emit('url', 'start', 'resolving example.com');
    p.emit('url', 'ok', 'example.com resolves to a public address');

    const first = await request(app).get(`/api/scans/${scan.id}/events`).set(auth(u.token));
    expect(first.status).toBe(200);
    expect(first.body.status).toBe('PENDING');
    expect(first.body.events.map((e: any) => e.msg)).toEqual(['resolving example.com', 'example.com resolves to a public address']);
    expect(first.body.next).toBe(2);

    p.emit('robots', 'ok', '/robots.txt → 200 (10 bytes)');
    const next = await request(app).get(`/api/scans/${scan.id}/events?after=${first.body.next}`).set(auth(u.token));
    expect(next.body.events).toHaveLength(1);
    expect(next.body.events[0]).toMatchObject({ stage: 'robots', level: 'ok', i: 2 });
    expect(next.body.next).toBe(3);
  });

  it('is private to the owning account and requires auth', async () => {
    const a = await signUp('events-a');
    const b = await signUp('events-b');
    const scan = await seedScan(a.userId, { status: 'PENDING' });
    openProgress(scan.id, a.userId).emit('url', 'start', 'secret target');

    expect((await request(app).get(`/api/scans/${scan.id}/events`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).get(`/api/scans/${scan.id}/events`)).status).toBe(401);
  });

  it('serves the saved log of a finished scan after the live copy is gone', async () => {
    const u = await signUp('events-saved');
    const log = [
      { i: 0, t: 0, stage: 'url', level: 'start', msg: 'resolving a.test' },
      { i: 1, t: 40, stage: 'scan', level: 'ok', msg: 'audit finished in 0.1s' }
    ];
    const scan = await seedScan(u.userId, { crawlData: { hasSimulatedData: false, log } });
    const res = await request(app).get(`/api/scans/${scan.id}/events`).set(auth(u.token));
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.events).toEqual(log);
    const tail = await request(app).get(`/api/scans/${scan.id}/events?after=1`).set(auth(u.token));
    expect(tail.body.events).toEqual([log[1]]);
  });

  it('a scan that fails keeps a log explaining why', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const u = await signUp('events-failed');
    const scan = await prisma.scan.create({ data: { url: 'http://169.254.169.254/', status: 'PENDING', userId: u.userId } });
    await runScan(scan.id, 'http://169.254.169.254/', 'SINGLE', 1, u.userId);

    const stored = await prisma.scan.findUnique({ where: { id: scan.id } });
    expect(stored?.status).toBe('FAILED');
    const log = (stored?.crawlData as any).log as Array<{ stage: string; level: string; msg: string }>;
    expect(log.some((e) => e.stage === 'url' && e.level === 'fail' && /refused/.test(e.msg))).toBe(true);
    expect(log.some((e) => e.stage === 'scan' && e.level === 'fail' && /aborted/.test(e.msg))).toBe(true);

    const res = await request(app).get(`/api/scans/${scan.id}/events`).set(auth(u.token));
    expect(res.body.status).toBe('FAILED');
    expect(res.body.events.length).toBe(log.length);
  });

  it('404s for a scan that does not exist', async () => {
    const u = await signUp('events-missing');
    expect((await request(app).get('/api/scans/nope/events').set(auth(u.token))).status).toBe(404);
  });
});
