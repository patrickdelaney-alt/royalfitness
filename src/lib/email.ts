/**
 * Email sending placeholder.
 *
 * Currently logs to the console. To send real emails, replace the body of
 * sendInviteEmail with a Resend (or Postmark/SendGrid) call, e.g.:
 *
 *   import { Resend } from 'resend';
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({ from: '...', to: email, subject: '...', html: '...' });
 *
 * Add RESEND_API_KEY (or equivalent) to .env.example and Vercel env vars when ready.
 */
export async function sendInviteEmail(
  email: string,
  firstName?: string | null
): Promise<void> {
  // TODO: replace with real email provider integration
  console.log(
    `[email] Invite queued for ${email}${firstName ? ` (${firstName})` : ""}`
  );
}
