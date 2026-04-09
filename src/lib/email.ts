import { Resend } from 'resend';

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('[email] RESEND_API_KEY is not configured — cannot send password reset email');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'Royal Fitness <noreply@royalwellness.app>',
    to: email,
    subject: 'Reset your Royal Fitness password',
    html: `
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for your Royal Fitness account.</p>
      <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="background-color: #1a4d2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; display: inline-block; font-weight: bold;">Reset Password</a></p>
      <p>If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
      <p>— The Royal Fitness team</p>
    `,
  });

  if (error) {
    console.error('[email] Failed to send password reset email to', email, error);
    throw new Error(error.message);
  }

  console.log('[email] Password reset email sent', { to: email, id: data?.id });
}

export async function sendInviteEmail(
  email: string,
  firstName?: string | null
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const displayName = firstName ? ` ${firstName}` : '';

  const { data, error } = await resend.emails.send({
    from: 'Royal Fitness <noreply@royalwellness.app>',
    to: email,
    subject: "You're approved! Welcome to Royal Fitness",
    html: `
      <h2>Welcome to Royal Fitness${displayName}!</h2>
      <p>Great news — your spot has been approved! You're ready to sign up and start tracking your fitness journey.</p>
      <p><a href="https://royalwellness.app/signup" style="background-color: #1a4d2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; display: inline-block; font-weight: bold;">Create Your Account</a></p>
      <p>If you have any questions, feel free to reach out. We can't wait to have you on board!</p>
      <p>— The Royal Fitness team</p>
    `,
  });

  if (error) {
    console.error('[email] Failed to send invite email to', email, error);
    // Don't throw — just log. Admin action already completed in DB.
  } else {
    console.log('[email] Invite email sent', { to: email, id: data?.id });
  }
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping welcome email');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'Royal <notifications@royalwellness.app>',
    to: email,
    subject: 'Welcome to Royal — start your wellness journey',
    html: `
      <p>Welcome to Royal.</p>
      <p>This is your space to share workouts, track your wellness, and connect with others on the same path.</p>
      <p>Start by posting your first activity or exploring what others are doing.</p>
      <p><a href="https://royalwellness.app">Open Royal →</a></p>
    `,
  });

  if (error) {
    console.error('[email] Failed to send welcome email to', email, error);
  } else {
    console.log('[email] Welcome email sent', { to: email, id: data?.id });
  }
}
