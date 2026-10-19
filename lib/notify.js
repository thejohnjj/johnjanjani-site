import 'server-only';

// Sends you an email through Resend when RESEND_API_KEY and LEAD_NOTIFY_EMAIL are set.
// Without them it does nothing; leads are still saved and visible at /admin.
export async function notify(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return;
  const text = lines.filter(Boolean).join('\n');
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'johnjanjani.com <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
      }),
    });
  } catch (e) {
    console.error('notify failed', e?.message);
  }
}
