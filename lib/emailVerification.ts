import { Response, NextFunction } from 'express';
import { prisma } from './db';
import { generateResetToken, hashResetToken } from './auth';
import { escapeHtml, isEmailConfigured, sendEmail } from './email';
import type { AuthRequest } from './authMiddleware';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

// Verification is only enforceable when a link can actually be delivered; without an email
// provider (local dev, tests) gating would lock every new account out with no way back in.
export function verificationRequired(): boolean {
  return isEmailConfigured();
}

/** Replaces any outstanding link for the user with a fresh one and emails it. */
export async function issueVerificationEmail(user: { id: string; email: string }, appUrl: string): Promise<void> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const { token, tokenHash } = generateResetToken();
  await prisma.emailVerificationToken.create({
    data: { tokenHash, email: user.email, expiresAt: new Date(Date.now() + VERIFY_TTL_MS), userId: user.id }
  });
  const link = `${appUrl}/?verifyToken=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Confirm your SeoScan email address',
    text: `Confirm this email address to start running scans.\n\nConfirm it here (valid for 24 hours):\n${link}\n\nIf you did not create an account, ignore this email.`,
    html: `<p>Confirm this email address to start running scans.</p><p><a href="${escapeHtml(link)}">Confirm your email</a> (valid for 24 hours).</p><p>If you did not create an account, ignore this email.</p>`
  });
}

/** Consumes a link. Returns false when it is unknown, expired, or for an address the user has since changed. */
export async function consumeVerificationToken(token: string): Promise<boolean> {
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: { select: { email: true } } }
  });
  if (!row || row.expiresAt < new Date() || row.user.email !== row.email) return false;
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: row.userId } })
  ]);
  return true;
}

// Guards the actions that cost money or resources (scans, monitors, API keys). Reading and
// account management stay open so an unverified user can still resend the link or fix a typo.
export async function requireVerifiedEmail(req: AuthRequest, res: Response, next: NextFunction) {
  if (!verificationRequired()) return next();
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { emailVerifiedAt: true } });
    if (user?.emailVerifiedAt) return next();
    return res.status(403).json({
      error: 'Confirm your email address to use this feature. Check your inbox for the link.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  } catch (err) {
    console.error('Verification lookup failed:', err);
    res.status(500).json({ error: 'Verification check failed' });
  }
}
