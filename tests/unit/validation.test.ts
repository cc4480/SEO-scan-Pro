import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, scanCreateSchema, widgetScanSchema, settingsSchema } from '../../lib/validation';

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'password1', name: 'A B' });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'short1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password with no letters', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(result.success).toBe(false);
  });

  it('rejects a password with no numbers', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'onlyletters' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email', password: 'password1' });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from email', () => {
    const result = registerSchema.safeParse({ email: '  a@b.com  ', password: 'password1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('a@b.com');
  });

  it('allows name to be omitted', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'password1' });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password (no complexity rules on login)', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const result = loginSchema.safeParse({ password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('scanCreateSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = scanCreateSchema.safeParse({ url: 'example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty url', () => {
    const result = scanCreateSchema.safeParse({ url: '' });
    expect(result.success).toBe(false);
  });

  it('coerces a numeric-string depth to a number', () => {
    const result = scanCreateSchema.safeParse({ url: 'example.com', depth: '3' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.depth).toBe(3);
  });

  it('rejects a depth above the max (5)', () => {
    const result = scanCreateSchema.safeParse({ url: 'example.com', depth: 99 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid mode value', () => {
    const result = scanCreateSchema.safeParse({ url: 'example.com', mode: 'EVERYTHING' });
    expect(result.success).toBe(false);
  });

  it('allows an empty-string leadEmail (optional field UX)', () => {
    const result = scanCreateSchema.safeParse({ url: 'example.com', leadEmail: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed leadEmail', () => {
    const result = scanCreateSchema.safeParse({ url: 'example.com', leadEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('widgetScanSchema', () => {
  it('requires a widgetKey', () => {
    const result = widgetScanSchema.safeParse({ url: 'example.com', email: 'a@b.com' });
    expect(result.success).toBe(false);
  });

  it('accepts a fully valid widget payload', () => {
    const result = widgetScanSchema.safeParse({ url: 'example.com', email: 'a@b.com', widgetKey: 'key123' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid lead email', () => {
    const result = widgetScanSchema.safeParse({ url: 'example.com', email: 'nope', widgetKey: 'key123' });
    expect(result.success).toBe(false);
  });
});

describe('settingsSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = settingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects an invalid language', () => {
    const result = settingsSchema.safeParse({ language: 'fr' });
    expect(result.success).toBe(false);
  });

  it('accepts en/es language values', () => {
    expect(settingsSchema.safeParse({ language: 'en' }).success).toBe(true);
    expect(settingsSchema.safeParse({ language: 'es' }).success).toBe(true);
  });

  it('rejects a malformed monitoringEmail', () => {
    const result = settingsSchema.safeParse({ monitoringEmail: 'nope' });
    expect(result.success).toBe(false);
  });

  it('allows monitoringEmail to be an empty string', () => {
    const result = settingsSchema.safeParse({ monitoringEmail: '' });
    expect(result.success).toBe(true);
  });
});
