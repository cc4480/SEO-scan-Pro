// Transactional email through Resend (https://resend.com), over its plain HTTP API — no SDK.
// Configure RESEND_API_KEY and EMAIL_FROM (a sender on a domain verified in Resend). With no key
// set, nothing is sent and the event is logged, so local development and tests need no provider.

const RESEND_URL = 'https://api.resend.com/emails';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

/** Returns true if the provider accepted the message. Never throws: email must not break a flow. */
export async function sendEmail(msg: OutgoingEmail): Promise<boolean> {
  if (!isEmailConfigured()) {
    // Subject only — bodies can carry credentials (reset links).
    console.log(`[email:stub] Would send "${msg.subject}" to ${msg.to} (set RESEND_API_KEY and EMAIL_FROM to send for real).`);
    return false;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text
      })
    });
    if (!res.ok) {
      console.error(`[email] Resend rejected "${msg.subject}" (${res.status}): ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${msg.subject}":`, err);
    return false;
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  // The link is a live one-hour credential: it goes into the email body only, and is
  // deliberately never logged (sendEmail's stub logs the subject, not the body).
  await sendEmail({
    to: toEmail,
    subject: 'Reset your SeoScan password',
    text: `Someone asked to reset the password for this account.\n\nReset it here (valid for 1 hour, single use):\n${resetLink}\n\nIf this was not you, ignore this email.`,
    html: `<p>Someone asked to reset the password for this account.</p><p><a href="${escapeHtml(resetLink)}">Reset your password</a> (valid for 1 hour, single use).</p><p>If this was not you, ignore this email.</p>`
  });
}

export async function sendScoreAlertEmail(
  toEmail: string,
  a: { agencyName: string; url: string; previousScore: number; currentScore: number; newIssues: string[]; reportUrl?: string }
): Promise<boolean> {
  const drop = a.previousScore - a.currentScore;
  const issues = a.newIssues.slice(0, 10);
  return sendEmail({
    to: toEmail,
    subject: `SEO score dropped ${drop} points on ${a.url}`,
    text:
      `${a.agencyName} monitoring alert\n\n${a.url}\nOverall score: ${a.previousScore} -> ${a.currentScore} (-${drop})\n` +
      (issues.length ? `\nNew critical issues:\n${issues.map((i) => `- ${i}`).join('\n')}\n` : '') +
      (a.reportUrl ? `\nOpen the app to see the full report: ${a.reportUrl}\n` : ''),
    html:
      `<h2>${escapeHtml(a.agencyName)} monitoring alert</h2><p><strong>${escapeHtml(a.url)}</strong></p>` +
      `<p>Overall score: ${a.previousScore} &rarr; <strong>${a.currentScore}</strong> (-${drop})</p>` +
      (issues.length ? `<p>New critical issues:</p><ul>${issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '') +
      (a.reportUrl ? `<p><a href="${escapeHtml(a.reportUrl)}">Open the app</a></p>` : '')
  });
}
