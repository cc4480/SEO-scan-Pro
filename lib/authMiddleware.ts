import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, hashApiKey, API_KEY_PREFIX } from './auth';
import { prisma } from './db';

export interface AuthRequest extends Request {
  userId?: string;
  /** How the caller authenticated. API keys are refused on account-management routes. */
  authMethod?: 'jwt' | 'apiKey';
}

// Resolves a bearer credential to a user id, or null. Two credential types share the header:
//  - a JWT, valid only while its `tv` claim still matches the user's tokenVersion
//    (so "log out everywhere" and password changes take effect immediately);
//  - an API key (`ssp_…`), looked up by hash.
async function resolveCredential(token: string): Promise<{ userId: string; method: 'jwt' | 'apiKey' } | null> {
  if (token.startsWith(API_KEY_PREFIX)) {
    const key = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(token) } });
    if (!key) return null;
    // Best-effort bookkeeping; never fail a request because of it.
    prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    return { userId: key.userId, method: 'apiKey' };
  }

  const decoded = verifyToken(token);
  // `verifyToken` already fails closed on a payload without a usable userId; this is a second
  // belt-and-braces check so `req.userId` can never be undefined on a route that scopes
  // Prisma queries by it.
  if (!decoded || typeof decoded.userId !== 'string' || decoded.userId.length === 0) return null;

  const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { tokenVersion: true } });
  if (!user || user.tokenVersion !== decoded.tokenVersion) return null;
  return { userId: decoded.userId, method: 'jwt' };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    const who = await resolveCredential(token);
    if (!who) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userId = who.userId;
    req.authMethod = who.method;
    next();
  } catch (err) {
    console.error('Auth lookup failed:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Session-only: account management (password, email, deletion, keys) must not be reachable
// with an API key, or a leaked CI key would be a full account takeover.
export function requireSession(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.authMethod !== 'jwt') {
    return res.status(403).json({ error: 'This action requires signing in; API keys cannot perform it.' });
  }
  next();
}

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const who = await resolveCredential(token);
      if (who) {
        req.userId = who.userId;
        req.authMethod = who.method;
      }
    } catch {
      // An unresolvable credential just means "anonymous" here.
    }
  }

  next();
}
