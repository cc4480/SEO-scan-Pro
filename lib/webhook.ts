import crypto from 'crypto';
import { safeFetch } from './ssrfGuard';

// Signs the raw JSON body with HMAC-SHA256, same pattern as Stripe/GitHub webhooks, so a
// receiver can verify a request genuinely came from us and wasn't forged/tampered with.
export function signWebhookPayload(secret: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export async function sendWebhook(url: string, secret: string, payload: Record<string, unknown>): Promise<void> {
  const rawBody = JSON.stringify(payload);
  const signature = signWebhookPayload(secret, rawBody);

  try {
    // safeFetch, not fetch: the URL is user-configured, and it is re-checked
    // here at send time rather than trusted from when it was saved — DNS for a
    // once-public hostname can be repointed at an internal address later.
    // maxRedirects 0: a webhook receiver has no business redirecting, and
    // following one would carry this signed payload somewhere the user never
    // configured.
    await safeFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SEOScan-Signature': `sha256=${signature}`
      },
      body: rawBody,
      timeoutMs: 8000,
      maxRedirects: 0,
      maxBytes: 64 * 1024
    });
  } catch (err) {
    // Webhook delivery is best-effort — a failing receiver should never affect the scan itself.
    console.error(`Webhook delivery failed for ${url}:`, err);
  }
}
