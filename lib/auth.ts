import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const JWT_EXPIRY = (process.env.JWT_EXPIRY || '7d') as SignOptions['expiresIn'];

// Read lazily, and never fall back to a default. A hardcoded fallback secret is a *published*
// secret: anyone holding it can mint a token for any account, and it silently masks a missing
// configuration. `validateEnv()` (lib/env.ts) gives the operator a clear error at boot; this is
// the last line of defence if a module is reached without that check.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Set a unique secret in .env — ' +
      'see .env.example for a generation command.'
    );
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// `tv` is the user's tokenVersion at issue time. authMiddleware compares it with the current value,
// so bumping User.tokenVersion revokes every outstanding token at once.
export function generateToken(userId: string, tokenVersion = 0): string {
  return jwt.sign({ userId, tv: tokenVersion }, getJwtSecret(), { expiresIn: JWT_EXPIRY, algorithm: 'HS256' });
}

export function verifyToken(token: string): { userId: string; tokenVersion: number } | null {
  try {
    // Pinning the algorithm prevents algorithm-confusion tricks; jsonwebtoken already
    // rejects `alg: none` for a string secret, but being explicit costs nothing.
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

    if (typeof decoded !== 'object' || decoded === null) return null;

    // Fail closed. A token that verifies but carries no usable userId would otherwise set
    // req.userId = undefined, and Prisma treats `undefined` as "no condition" — turning
    // every `where: { userId }` into an unscoped query across all users.
    const userId = (decoded as { userId?: unknown }).userId;
    if (typeof userId !== 'string' || userId.length === 0) return null;

    // Tokens issued before revocation existed carry no `tv`; they count as version 0.
    const tv = (decoded as { tv?: unknown }).tv;
    return { userId, tokenVersion: typeof tv === 'number' ? tv : 0 };
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

// Password reset tokens are high-entropy random values, not low-entropy user secrets —
// a fast SHA-256 lookup hash is appropriate here (unlike bcrypt for passwords), since the
// token itself already has 256 bits of randomness and only needs to be matched, not
// resistant to offline brute-force against a small keyspace.
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  return { token, tokenHash };
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ── API keys ────────────────────────────────────────────────────────────────
// Long-lived credentials for scripts and CI. High-entropy random values, so (like reset tokens)
// a fast SHA-256 lookup hash is the right storage; the plaintext is only ever shown once.
export const API_KEY_PREFIX = 'ssp_';

export function generateApiKey(): { key: string; prefix: string; keyHash: string } {
  const key = API_KEY_PREFIX + crypto.randomBytes(24).toString('base64url');
  return { key, prefix: key.slice(0, 8), keyHash: hashApiKey(key) };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
