import nodemailer from 'npm:nodemailer@6.9.14';

const PROJECT_URL = 'https://nqkmnmwbmikbgopwkvse.supabase.co';
const FROM_EMAIL = 'apis.new.world@gmail.com';
const ALLOWED_ORIGINS = new Set([
  'https://hivetools.pro',
  'https://hivetools-5lrhddnfo-apis-ai.vercel.app',
]);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://hivetools.pro',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function response(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function genericSuccess(origin: string | null) {
  return response({ ok: true, message: 'If the account exists, a recovery code will be sent to its email address.' }, 200, origin);
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  let stage = 'validate request';
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405, origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return response({ error: 'Origin not allowed.' }, 403, origin);
  if (Number(request.headers.get('content-length') || 0) > 2048) return response({ error: 'Request too large.' }, 413, origin);

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return response({ error: 'Enter a valid account email.' }, 400, origin);
    }

    stage = 'load server credentials';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const gmailUser = Deno.env.get('GMAIL_USER')?.trim().toLowerCase();
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
    if (!serviceKey || gmailUser !== FROM_EMAIL || !gmailPassword) {
      console.error('password-reset is missing a required server-side credential');
      return genericSuccess(origin);
    }

    const rateLimitResponse = await fetch(`${PROJECT_URL}/rest/v1/rpc/consume_password_reset_request`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_email_hash: await sha256(email) }),
    });
    stage = 'check rate limit';
    if (!rateLimitResponse.ok) {
      console.error('password-reset rate limit service returned HTTP', rateLimitResponse.status);
      return genericSuccess(origin);
    }
    if (await rateLimitResponse.json() !== true) return genericSuccess(origin);

    stage = 'generate recovery code';
    const linkResponse = await fetch(`${PROJECT_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'recovery', email }),
    });
    if (!linkResponse.ok) {
      console.error('password-reset Auth generate_link returned HTTP', linkResponse.status);
      return genericSuccess(origin);
    }

    const linkData = await linkResponse.json();
    const recoveryCode = linkData?.email_otp
      ?? linkData?.properties?.email_otp
      ?? linkData?.data?.email_otp
      ?? linkData?.data?.properties?.email_otp;
    if (typeof recoveryCode !== 'string' || !/^\d{6}$/.test(recoveryCode)) {
      console.error('password-reset Auth response shape:', {
        topLevelKeys: Object.keys(linkData || {}),
        propertiesKeys: Object.keys(linkData?.properties || {}),
        dataKeys: Object.keys(linkData?.data || {}),
        nestedPropertiesKeys: Object.keys(linkData?.data?.properties || {}),
      });
      return genericSuccess(origin);
    }

    stage = 'send recovery email';
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPassword },
    });
    try {
      await transporter.sendMail({
        from: `Hive <${FROM_EMAIL}>`,
        to: email,
        replyTo: FROM_EMAIL,
        subject: 'Your Hive password recovery code',
        text: `Your Hive password recovery code is ${recoveryCode}.\n\nEnter this code in your Hive account settings to choose a new password. It expires soon and can only be used once. If you did not request this, you can ignore this email.`,
        html: `<main style="max-width:560px;margin:0 auto;font:16px/1.6 Arial,sans-serif;color:#202124"><p>We received a request to reset your Hive password.</p><p style="margin:24px 0;padding:16px;text-align:center;border-radius:12px;background:#f4f4f4;font-size:30px;font-weight:700;letter-spacing:8px">${recoveryCode}</p><p>Enter this code in your signed-in Hive account settings to choose a new password. It expires soon and can only be used once.</p><p>If you did not request this, you can ignore this email. Your password will not change unless the code is verified.</p><p>— The Hive team</p></main>`,
      });
      console.log('password-reset recovery email accepted by Gmail SMTP');
    } finally {
      transporter.close();
    }
    return genericSuccess(origin);
  } catch (error) {
    console.error('password-reset failed at stage:', stage, error instanceof Error ? error.name : 'unknown error');
    return genericSuccess(origin);
  }
});
