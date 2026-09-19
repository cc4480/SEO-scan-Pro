import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken, extractTokenFromHeader } from '../../lib/auth';

describe('hashPassword / verifyPassword', () => {
  it('hashes a password to something other than the plaintext', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash).not.toBe('correct-horse-battery-staple');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('my-secret-password');
    await expect(verifyPassword('my-secret-password', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('my-secret-password');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (salted)', async () => {
    const hashA = await hashPassword('same-input');
    const hashB = await hashPassword('same-input');
    expect(hashA).not.toBe(hashB);
  });
});

describe('generateToken / verifyToken', () => {
  it('generates a token that verifies back to the same userId', () => {
    const token = generateToken('user_123');
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('user_123');
  });

  it('returns null for a garbage token', () => {
    expect(verifyToken('not.a.real.token')).toBeNull();
  });

  it('returns null for a token signed with a different secret', () => {
    // jwt.io-style forged token — different secret, should not verify
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJoYWNrZXIifQ.invalidSignatureHere';
    expect(verifyToken(forged)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(verifyToken('')).toBeNull();
  });
});

describe('extractTokenFromHeader', () => {
  it('extracts the token from a well-formed Bearer header', () => {
    expect(extractTokenFromHeader('Bearer abc123')).toBe('abc123');
  });

  it('returns null when the header is missing', () => {
    expect(extractTokenFromHeader(undefined)).toBeNull();
  });

  it('returns null when the header has no Bearer prefix', () => {
    expect(extractTokenFromHeader('abc123')).toBeNull();
  });

  it('returns null when the header uses the wrong scheme', () => {
    expect(extractTokenFromHeader('Basic abc123')).toBeNull();
  });

  it('returns null when the header has extra segments', () => {
    expect(extractTokenFromHeader('Bearer abc123 extra')).toBeNull();
  });
});
