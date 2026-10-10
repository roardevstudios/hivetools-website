// Supabase Edge Function: send claim receipt emails FROM apis.new.world@gmail.com
// via Gmail SMTP (nodemailer + an App Password — NOT your normal password).
//
// Setup (one time):
//   1. Google Account > Security > enable 2-Step Verification.
//   2. Google Account > Security > App passwords > create one for "Mail"
//      (16 letters, e.g. abcd efgh ijkl mnop). Keep it private.
//   3. supabase secrets set GMAIL_USER=apis.new.world@gmail.com GMAIL_APP_PASSWORD=xxxx
//   4. supabase functions deploy send-claim-receipt
//   5. Supabase Dashboard > Database > Webhooks: on INSERT into
//      public.claim_notifications -> this function.
//
// Payload: { record: { code, email } }. Skips when email is null.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import nodemailer from 'npm:nodemailer@6.9.14';

const FROM = 'Hive <apis.new.world@gmail.com>';
const SUPPORT = 'apis.new.world@gmail.com';

serve(async (req) => {
  try {
    const { record } = await req.json();
    if (!record || !record.email) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: Deno.env.get('GMAIL_USER'),
        pass: Deno.env.get('GMAIL_APP_PASSWORD'),
      },
    });

    const info = await transporter.sendMail({
      from: FROM,
      to: record.email,
      replyTo: SUPPORT,
      subject: `Your Hive download code ${record.code}`,
      html: `<p>Thanks for claiming Hive!</p>
<p>Your access code: <b style="font-family:monospace;font-size:18px;">${record.code}</b></p>
<p>Download any time at <a href="https://hivetools.pro/download">hivetools.pro/download</a>.</p>
<p>Problems? Just reply to this email or contact <a href="mailto:${SUPPORT}">${SUPPORT}</a>.</p>`,
    });

    return new Response(JSON.stringify({ sent: true, id: info.messageId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
