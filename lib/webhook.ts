import crypto from 'crypto';

// Signs the raw JSON body with HMAC-SHA256, same pattern as Stripe/GitHub webhooks, so a
// receiver can verify a request genuinely came from us and wasn't forged/tampered with.
export function signWebhookPayload(secret: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export async function sendWebhook(url: string, secret: string, payload: Record<string, unknown>): Promise<void> {
  const rawBody = JSON.stringify(payload);
  const signature = signWebhookPayload(secret, rawBody);

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SEOScan-Signature': `sha256=${signature}`
      },
      body: rawBody,
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    // Webhook delivery is best-effort — a failing receiver should never affect the scan itself.
    console.error(`Webhook delivery failed for ${url}:`, err);
  }
}
