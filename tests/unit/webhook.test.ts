import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { signWebhookPayload } from '../../lib/webhook';

describe('signWebhookPayload', () => {
  it('produces a hex-encoded HMAC-SHA256 digest', () => {
    const sig = signWebhookPayload('my-secret', '{"a":1}');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same secret and body', () => {
    const sigA = signWebhookPayload('my-secret', '{"a":1}');
    const sigB = signWebhookPayload('my-secret', '{"a":1}');
    expect(sigA).toBe(sigB);
  });

  it('changes when the body changes', () => {
    const sigA = signWebhookPayload('my-secret', '{"a":1}');
    const sigB = signWebhookPayload('my-secret', '{"a":2}');
    expect(sigA).not.toBe(sigB);
  });

  it('changes when the secret changes', () => {
    const sigA = signWebhookPayload('secret-one', '{"a":1}');
    const sigB = signWebhookPayload('secret-two', '{"a":1}');
    expect(sigA).not.toBe(sigB);
  });

  it('matches an independently computed HMAC (verifies a receiver could validate it)', () => {
    const secret = 'shared-secret';
    const body = '{"event":"seo_lead_captured"}';
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    expect(signWebhookPayload(secret, body)).toBe(expected);
  });
});
