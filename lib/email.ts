// Email sending is stubbed out: no third-party provider is wired up yet.
// Every function here logs what WOULD be sent instead of actually sending it.
// To go live, replace the body of sendPasswordResetEmail with a real provider call
// (Resend/SendGrid/Nodemailer, etc.) — the call sites elsewhere in the app don't change.

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  console.log(
    `\n[email:stub] Password reset requested for ${toEmail}\n` +
    `[email:stub] Reset link (would be emailed): ${resetLink}\n` +
    `[email:stub] No email provider is configured — see lib/email.ts.\n`
  );
}
