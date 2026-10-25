import nodemailer from 'npm:nodemailer@6.9.14';

const PROJECT_URL = 'https://nqkmnmwbmikbgopwkvse.supabase.co';
const FROM_EMAIL = 'apis.new.world@gmail.com';
const SUPPORT_EMAIL = 'apis.new.world@gmail.com';
const ALLOWED_ORIGIN = 'https://hivetools.pro';
const MAX_RECIPIENTS_PER_SEND = 450;

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

async function getRecipients(serviceKey: string) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const recipientsResponse = await fetch(
    `${PROJECT_URL}/rest/v1/release_email_recipients?select=email&limit=1000`,
    { headers },
  );
  if (!recipientsResponse.ok) throw new Error('Could not load opted-in release email recipients.');
  const rows = await recipientsResponse.json();
  const recipients = new Set<string>();
  for (const row of rows) {
    if (typeof row.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      recipients.add(row.email.trim().toLowerCase());
    }
  }
  return [...recipients];
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);
  if (request.headers.get('origin') !== ALLOWED_ORIGIN) return response({ error: 'Origin not allowed.' }, 403);

  const authorization = request.headers.get('authorization') || '';
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!accessToken || !publishableKey) return response({ error: 'Sign in with the admin account first.' }, 401);

  try {
    const userResponse = await fetch(`${PROJECT_URL}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) return response({ error: 'Your session has expired. Sign in again.' }, 401);

    const adminResponse = await fetch(`${PROJECT_URL}/rest/v1/rpc/is_hive_admin`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!adminResponse.ok || await adminResponse.json() !== true) {
      return response({ error: 'Admin access is required.' }, 403);
    }

    const body = await request.json();
    if (!['preview', 'send', 'test'].includes(body.action)) return response({ error: 'Choose preview, test, or send.' }, 400);
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (body.action === 'preview') {
      if (!serviceKey) return response({ error: 'The server is missing its private database key.' }, 503);
      const recipients = await getRecipients(serviceKey);
      return response({ recipientCount: recipients.length });
    }

    const gmailUser = Deno.env.get('GMAIL_USER')?.trim().toLowerCase();
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
    if (gmailUser !== FROM_EMAIL || !gmailPassword) {
      return response({ error: 'Gmail sender is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in Supabase function secrets.' }, 503);
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: gmailUser, pass: gmailPassword },
    });
    if (body.action === 'test') {
      await transporter.sendMail({
        from: `Hive <${FROM_EMAIL}>`,
        to: FROM_EMAIL,
        replyTo: SUPPORT_EMAIL,
        subject: 'Hive release email delivery test',
        text: 'This is a test message confirming that Hive release emails can be sent.',
        html: '<p>This is a test message confirming that Hive release emails can be sent.</p>',
      });
      await transporter.close();
      return response({ tested: true });
    }

    if (!serviceKey) return response({ error: 'The server is missing its private database key.' }, 503);
    const recipients = await getRecipients(serviceKey);
    if (!recipients.length) return response({ error: 'There are no opted-in recipients yet.' }, 400);
    if (recipients.length > MAX_RECIPIENTS_PER_SEND) {
      return response({ error: 'This list is above the Gmail send limit for one broadcast. Use a dedicated mailing service before sending.' }, 400);
    }

    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!subject || subject.length > 120 || !message || message.length > 8000) {
      return response({ error: 'Add a subject (up to 120 characters) and message (up to 8,000 characters).' }, 400);
    }

    const safeSubject = escapeHtml(subject);
    const htmlMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');
    await transporter.sendMail({
      from: `Hive <${FROM_EMAIL}>`,
      to: FROM_EMAIL,
      bcc: recipients,
      replyTo: SUPPORT_EMAIL,
      subject,
      text: `${message}\n\nTo unsubscribe, email ${SUPPORT_EMAIL} with “unsubscribe” in the subject, or turn off release updates in your Hive profile.`,
      html: `<main style="max-width:640px;margin:0 auto;font:16px/1.6 Arial,sans-serif;color:#202124"><h1 style="font-size:22px">${safeSubject}</h1><p>${htmlMessage}</p><hr><p style="font-size:13px;color:#5f6368">To unsubscribe, <a href="mailto:${SUPPORT_EMAIL}?subject=Unsubscribe%20Hive%20release%20updates">email us with “unsubscribe” in the subject</a>, or <a href="https://hivetools.pro/profile">turn off release updates in your Hive profile</a>.</p></main>`,
      headers: { 'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}?subject=Unsubscribe%20Hive%20release%20updates>` },
    });
    await transporter.close();
    return response({ sent: recipients.length, recipientCount: recipients.length });
  } catch (error) {
    console.error('release-email failure:', error);
    return response({ error: 'The release email could not be sent. Check the function logs and Gmail configuration.' }, 500);
  }
});
