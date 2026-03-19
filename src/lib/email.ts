import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(
  email: string,
  firstName?: string | null
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return;
  }

  const displayName = firstName ? ` ${firstName}` : '';

  try {
    await resend.emails.send({
      from: 'Royal Fitness <noreply@royalwellness.app>',
      to: email,
      subject: 'You're approved! Welcome to Royal Fitness beta',
      html: `
        <h2>Welcome to Royal Fitness${displayName}!</h2>
        <p>Great news — your spot has been approved! You're ready to sign up and start tracking your fitness journey.</p>
        <p><a href="https://royalwellness.app/signup" style="background-color: #1a4d2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; display: inline-block; font-weight: bold;">Create Your Account</a></p>
        <p>If you have any questions, feel free to reach out. We can't wait to have you on board!</p>
        <p>— The Royal Fitness team</p>
      `,
    });
  } catch (error) {
    console.error('[email] Failed to send invite email to', email, error);
    // Don't throw — just log. Admin action already completed in DB.
  }
}
