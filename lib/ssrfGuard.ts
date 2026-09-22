// SSRF guard — every outbound request this server makes on a user's behalf goes
// through here.
//
// Why this exists: SEO Scan Pro fetches URLs it does not choose. A user (or,
// via /api/widget/scan, anyone on the internet with no account) names the
// target; the target's robots.txt names the sitemap; the target's HTML names
// the subpages; the user's settings name the webhook. Without a guard, each of
// those is a way to make this server request its own internal network — cloud
// metadata at 169.254.169.254 (which hands out credentials on most clouds),
// the database, admin ports on localhost.
//
// Two layers, because a check on the hostname alone is not enough:
//
//  1. assertPublicUrl() — a fast up-front check: http(s) only, and every
//     address the hostname resolves to must be public. Rejects bad input with a
//     useful message before any work is queued.
//
//  2. The connect-time check in safeFetch() — the address is validated inside
//     the socket's DNS lookup, i.e. on the exact IP the connection is made to.
//     This is what defeats DNS rebinding: a hostname that resolves to a public
//     IP for the up-front check and to 127.0.0.1 a moment later. A
//     check-then-fetch pair has that gap; a check inside the lookup does not.
//
// Redirects are never followed automatically. Each hop is re-validated, since
// a public host that 302s to an internal one is the most common SSRF bypass.

import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfBlockedError';
  }
}

// ── Address classification ──────────────────────────────────────────────────

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

// [network, prefix length]. Anything not publicly routable, plus the ranges
// that are technically public but exist only for testing/benchmarking.
const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],        // "this network" — 0.0.0.0 reaches localhost on Linux
  ['10.0.0.0', 8],       // private
  ['100.64.0.0', 10],    // carrier-grade NAT (also some cloud internal ranges)
  ['127.0.0.0', 8],      // loopback
  ['169.254.0.0', 16],   // link-local — cloud metadata lives here
  ['172.16.0.0', 12],    // private
  ['192.0.0.0', 24],     // IETF protocol assignments
  ['192.0.2.0', 24],     // TEST-NET-1
  ['192.88.99.0', 24],   // 6to4 relay (deprecated)
  ['192.168.0.0', 16],   // private
  ['198.18.0.0', 15],    // benchmarking
  ['198.51.100.0', 24],  // TEST-NET-2
  ['203.0.113.0', 24],   // TEST-NET-3
  ['224.0.0.0', 4],      // multicast
  ['240.0.0.0', 4],      // reserved, incl. 255.255.255.255 broadcast
];

function isBlockedV4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return BLOCKED_V4.some(([net_, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(net_) & mask);
  });
}

function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase().split('%')[0]; // drop any zone id (fe80::1%eth0)

  // IPv4-mapped / IPv4-compatible forms (::ffff:127.0.0.1, ::127.0.0.1, and
  // the hex spelling ::ffff:7f00:1). Without this, the whole IPv4 blocklist is
  // bypassable by writing the same address in IPv6 notation.
  const dotted = lower.match(/^::(?:ffff:(?:0:)?)?(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return isBlockedV4(dotted[1]);
  const hexMapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16);
    const lo = parseInt(hexMapped[2], 16);
    return isBlockedV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }

  if (lower === '::' || lower === '::1') return true;        // unspecified, loopback
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;         // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;         // fe80::/10 link-local
  if (/^fec[0-9a-f]:|^fe[d-f][0-9a-f]:/.test(lower)) return true; // fec0::/10 site-local (deprecated)
  if (/^ff[0-9a-f]{2}:/.test(lower)) return true;            // ff00::/8 multicast
  if (/^2001:0?db8:/.test(lower)) return true;               // documentation
  if (/^64:ff9b:/.test(lower)) return true;                  // NAT64 — can embed a private v4
  if (/^2002:/.test(lower)) return true;                     // 6to4 — can embed a private v4
  return false;
}

// Test-only: the webhook integration test delivers to a real HTTP receiver on
// 127.0.0.1, which is exactly what this guard exists to refuse. Rather than
// mock the delivery path away, loopback — and ONLY loopback, never private
// ranges or metadata — may be allowed when BOTH hold:
//   NODE_ENV === 'test'           (vitest sets it; never true in production)
//   SSRF_ALLOW_LOOPBACK === 'true' (set explicitly by the test that needs it)
// Read per call, so a test can turn it off again to prove the block.
function loopbackAllowedForTests(ip: string): boolean {
  if (process.env.NODE_ENV !== 'test' || process.env.SSRF_ALLOW_LOOPBACK !== 'true') return false;
  return ip === '::1' || (net.isIP(ip) === 4 && ip.startsWith('127.'));
}

/** True when `ip` is not a publicly routable unicast address. */
export function isBlockedAddress(ip: string): boolean {
  if (loopbackAllowedForTests(ip)) return false;
  const family = net.isIP(ip);
  if (family === 4) return isBlockedV4(ip);
  if (family === 6) return isBlockedV6(ip);
  return true; // not an IP at all — refuse rather than guess
}

// ── Up-front URL check ──────────────────────────────────────────────────────

/**
 * Throws SsrfBlockedError unless `raw` is an http(s) URL whose host resolves
 * only to public addresses. Returns the parsed URL.
 *
 * EVERY resolved address must be public, not just the first: a hostname with
 * one public and one private A record would otherwise pass here and then have
 * the connection land on the private one.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfBlockedError('That is not a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfBlockedError('Only http:// and https:// URLs can be scanned.');
  }
  if (url.username || url.password) {
    throw new SsrfBlockedError('URLs containing credentials cannot be scanned.');
  }

  // URL keeps IPv6 literals bracketed ("[::1]"); dns and net want them bare.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host) throw new SsrfBlockedError('That URL has no host.');

  if (net.isIP(host)) {
    if (isBlockedAddress(host)) throw new SsrfBlockedError('That address is private or reserved and cannot be scanned.');
    return url;
  }

  // Names that are local by definition, whatever DNS would say.
  if (/(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/i.test(host)) {
    throw new SsrfBlockedError('That host is on a private network and cannot be scanned.');
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new SsrfBlockedError(`Could not resolve ${host}.`);
  }
  if (addresses.length === 0) throw new SsrfBlockedError(`Could not resolve ${host}.`);
  if (addresses.some((a) => isBlockedAddress(a.address))) {
    throw new SsrfBlockedError('That host resolves to a private or reserved address and cannot be scanned.');
  }
  return url;
}

// ── Connect-time guarded fetch ──────────────────────────────────────────────

// A dns.lookup replacement handed to http(s).request. Node calls it to resolve
// the host for the socket it is about to open, so validating here validates
// the address actually connected to — closing the rebinding window between
// assertPublicUrl() and the request.
export const guardedLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
    if (err) return (callback as any)(err);
    const list = addresses as unknown as dns.LookupAddress[];
    const bad = list.find((a) => isBlockedAddress(a.address));
    if (bad || list.length === 0) {
      return (callback as any)(new SsrfBlockedError(`Blocked connection to a private or reserved address (${hostname}).`));
    }
    if ((options as dns.LookupOptions).all) return (callback as any)(null, list);
    return (callback as any)(null, list[0].address, list[0].family);
  });
};

export interface SafeResponse {
  status: number;
  ok: boolean;
  headers: http.IncomingHttpHeaders;
  url: string;
  text: string;
}

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  /** Redirect hops to follow, each re-validated. 0 = never follow. */
  maxRedirects?: number;
  /** Response bodies are capped so a hostile target cannot exhaust memory. */
  maxBytes?: number;
}

/**
 * fetch-alike that refuses private destinations at connect time and
 * re-validates every redirect hop. Throws SsrfBlockedError when blocked.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeResponse> {
  const { method = 'GET', headers = {}, body, timeoutMs = 8000, maxRedirects = 3, maxBytes = 2 * 1024 * 1024 } = opts;
  let current = (await assertPublicUrl(rawUrl)).toString();

  for (let hop = 0; ; hop++) {
    const res = await requestOnce(current, { method, headers, body, timeoutMs, maxBytes });
    const location = res.headers.location;
    if (res.status >= 300 && res.status < 400 && location) {
      if (hop >= maxRedirects) return res; // hand back the redirect itself, unfollowed
      // Resolve relative Location against the current URL, then validate the
      // new destination exactly like the first — a redirect is a new request.
      current = (await assertPublicUrl(new URL(location, current).toString())).toString();
      continue;
    }
    return res;
  }
}

function requestOnce(
  url: string,
  o: { method: string; headers: Record<string, string>; body?: string; timeoutMs: number; maxBytes: number },
): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(
      u,
      {
        method: o.method,
        headers: o.body ? { ...o.headers, 'Content-Length': Buffer.byteLength(o.body).toString() } : o.headers,
        lookup: guardedLookup,
        timeout: o.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (c: Buffer) => {
          size += c.length;
          if (size > o.maxBytes) {
            res.destroy();
            return;
          }
          chunks.push(c);
        });
        res.on('end', () => finish());
        res.on('close', () => finish());
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          const status = res.statusCode ?? 0;
          resolve({ status, ok: status >= 200 && status < 300, headers: res.headers, url, text: Buffer.concat(chunks).toString('utf8') });
        };
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Request to ${u.host} timed out`)));
    req.on('error', reject);
    if (o.body) req.write(o.body);
    req.end();
  });
}

// ── Headless-browser guard ──────────────────────────────────────────────────

// Per-hostname verdict cache for the browser guard. A single page can make
// hundreds of subresource requests, mostly to a handful of hosts, and
// re-resolving each one would make every render crawl. Short-lived so a
// changed DNS answer is picked up within the minute.
const hostVerdicts = new Map<string, { allowed: boolean; at: number }>();
const VERDICT_TTL_MS = 60_000;

/**
 * Whether the headless browser may request `rawUrl`. Used by request
 * interception, so it applies to EVERY request the page makes — navigations,
 * redirects, iframes, images, scripts, fetch/XHR from the page's own JS — not
 * only the URL the crawler asked for. A target page cannot use its own
 * JavaScript to reach this server's internal network.
 *
 * Chromium resolves DNS itself, so unlike safeFetch() this check cannot sit
 * inside the connect. The rebinding residue is closed after the fact by
 * checking response.remoteAddress() on the page's main response (see
 * crawler.ts) — and, for any deployment, by denying the container egress to
 * private ranges at the network layer, which is the only complete control for
 * a browser.
 */
export async function browserRequestAllowed(rawUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  // data:/blob: carry no network request; about:blank is the empty page.
  if (url.protocol === 'data:' || url.protocol === 'blob:' || rawUrl === 'about:blank') return true;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false; // file:, ftp:, chrome:, ws: …

  const key = url.hostname.toLowerCase();
  const cached = hostVerdicts.get(key);
  if (cached && Date.now() - cached.at < VERDICT_TTL_MS) return cached.allowed;

  let allowed = true;
  try {
    await assertPublicUrl(rawUrl);
  } catch {
    allowed = false;
  }
  hostVerdicts.set(key, { allowed, at: Date.now() });
  if (hostVerdicts.size > 5000) hostVerdicts.clear(); // bound memory on a long-lived process
  return allowed;
}
