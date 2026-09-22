import { describe, it, expect } from 'vitest';
import { assertPublicUrl, browserRequestAllowed, guardedLookup, isBlockedAddress, SsrfBlockedError } from '../../lib/ssrfGuard';

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1', '127.255.255.254',   // loopback, whole /8
    '10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', // RFC 1918
    '169.254.169.254',                 // cloud metadata
    '100.64.0.1',                      // CGNAT
    '0.0.0.0',                         // reaches localhost on Linux
    '224.0.0.1', '255.255.255.255',    // multicast, broadcast
    '::1', '::',                       // v6 loopback, unspecified
    'fc00::1', 'fd12:3456::1',         // unique-local
    'fe80::1', 'fe80::1%eth0',         // link-local, with zone id
  ])('blocks %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  // The IPv6 spellings of blocked IPv4 addresses. A check that only knows the
  // dotted-quad forms is bypassed by every one of these.
  it.each([
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    '::ffff:7f00:1',        // 127.0.0.1, hex spelling
    '::ffff:a9fe:a9fe',     // 169.254.169.254, hex spelling
    '::127.0.0.1',          // IPv4-compatible (deprecated)
    '64:ff9b::a9fe:a9fe',   // NAT64 prefix — can embed any v4
    '2002:7f00:1::',        // 6to4 — can embed any v4
  ])('blocks the IPv6-embedded form %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '93.184.216.34', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111'])('allows public %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  it('refuses anything that is not an IP rather than guessing', () => {
    expect(isBlockedAddress('not-an-ip')).toBe(true);
    expect(isBlockedAddress('')).toBe(true);
  });
});

describe('assertPublicUrl', () => {
  const blocked = async (url: string) => {
    await expect(assertPublicUrl(url)).rejects.toBeInstanceOf(SsrfBlockedError);
  };

  it('blocks private and metadata IP literals', async () => {
    await blocked('http://127.0.0.1/');
    await blocked('http://169.254.169.254/latest/meta-data/');
    await blocked('http://10.0.0.5:6379/');
    await blocked('http://[::1]/');
    await blocked('http://[::ffff:127.0.0.1]/');
  });

  // The WHATWG URL parser normalises these to 127.0.0.1 before the check sees
  // them, so the classic "decimal/octal/hex IP" bypasses land on the blocklist.
  it('blocks alternate encodings of loopback', async () => {
    await blocked('http://2130706433/');     // decimal
    await blocked('http://0x7f000001/');     // hex
    await blocked('http://0177.0.0.1/');     // octal
    await blocked('http://127.1/');          // short form
  });

  it('blocks names that are local by definition, without asking DNS', async () => {
    await blocked('http://localhost:3000/');
    await blocked('http://api.localhost/');
    await blocked('http://printer.local/');
    await blocked('http://metadata.google.internal/');
  });

  it('blocks non-http schemes and embedded credentials', async () => {
    await blocked('file:///etc/passwd');
    await blocked('gopher://127.0.0.1:6379/_INFO');
    await blocked('ftp://example.com/');
    await blocked('http://user:pass@example.com/');
  });

  it('rejects garbage', async () => {
    await blocked('not a url');
  });

  it('allows a public IP literal', async () => {
    await expect(assertPublicUrl('https://93.184.216.34/')).resolves.toBeInstanceOf(URL);
  });
});

// The connect-time layer: the lookup Node uses for the socket itself. This is
// what defeats DNS rebinding, so it is tested directly rather than trusted to
// the up-front check.
describe('guardedLookup', () => {
  it('refuses to hand a private address to the socket', async () => {
    const err = await new Promise<Error | null>((resolve) => {
      guardedLookup('localhost', {}, (e) => resolve(e as Error | null));
    });
    expect(err).toBeInstanceOf(SsrfBlockedError);
  });
});

describe('browserRequestAllowed', () => {
  it('blocks the requests a hostile page would script', async () => {
    expect(await browserRequestAllowed('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(await browserRequestAllowed('http://127.0.0.1:5432/')).toBe(false);
    expect(await browserRequestAllowed('file:///etc/passwd')).toBe(false);
    expect(await browserRequestAllowed('ws://127.0.0.1:9229/')).toBe(false); // node inspector
  });

  it('lets inline content through, since it makes no network request', async () => {
    expect(await browserRequestAllowed('data:image/png;base64,AAAA')).toBe(true);
    expect(await browserRequestAllowed('about:blank')).toBe(true);
  });
});

describe('the test-only loopback allowance', () => {
  it('is inert outside NODE_ENV=test, even when the flag is set', () => {
    const saved = process.env.NODE_ENV;
    process.env.SSRF_ALLOW_LOOPBACK = 'true';
    try {
      process.env.NODE_ENV = 'production';
      expect(isBlockedAddress('127.0.0.1')).toBe(true);
      process.env.NODE_ENV = 'development';
      expect(isBlockedAddress('127.0.0.1')).toBe(true);
    } finally {
      process.env.NODE_ENV = saved;
      delete process.env.SSRF_ALLOW_LOOPBACK;
    }
  });

  it('never opens anything beyond loopback, even in tests', () => {
    process.env.SSRF_ALLOW_LOOPBACK = 'true';
    try {
      expect(isBlockedAddress('127.0.0.1')).toBe(false);
      expect(isBlockedAddress('169.254.169.254')).toBe(true);
      expect(isBlockedAddress('10.0.0.1')).toBe(true);
      expect(isBlockedAddress('192.168.1.1')).toBe(true);
    } finally {
      delete process.env.SSRF_ALLOW_LOOPBACK;
    }
  });
});
