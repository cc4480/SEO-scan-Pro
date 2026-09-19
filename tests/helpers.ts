import request from 'supertest';

// scanAsync runs fire-and-forget after the route responds, and now involves a real headless
// browser render (Puppeteer), which is slower and more variable than the old plain fetch —
// a fixed sleep was flaky. Poll instead of guessing a delay.
export async function waitForScanStatus(
  app: any,
  scanId: string,
  token: string | undefined,
  maxWaitMs = 20000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const req = request(app).get(`/api/scans/${scanId}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    const res = await req;
    const status = res.body?.status;
    if (status === 'COMPLETED' || status === 'FAILED') {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Scan ${scanId} did not finish within ${maxWaitMs}ms`);
}
