import nodemailer from 'npm:nodemailer@6.9.14';

const PROJECT_URL = 'https://nqkmnmwbmikbgopwkvse.supabase.co';
const FROM_EMAIL = 'apis.new.world@gmail.com';
const SUPPORT_EMAIL = FROM_EMAIL;
const AUDIENCE = PROJECT_URL + '/functions/v1/github-release-email';
const EXPECTED_REPOSITORY = 'Hive-AI-APP/Hive-Public-Hive';
const EXPECTED_REPOSITORY_ID = '1393528873';
const EXPECTED_WORKFLOW_PREFIX = EXPECTED_REPOSITORY + '/.github/workflows/release-email.yml@refs/';
const MAX_RECIPIENTS_PER_SEND = 450;

type JwtClaims = Record<string, unknown> & {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  repository?: string;
  repository_id?: string;
  event_name?: string;
  workflow_ref?: string;
  ref?: string;
};

type Release = {
  id?: number | string;
  tag_name?: string;
  name?: string | null;
  body?: string | null;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
};

type ReleasePayload = { action?: string; release?: Release };

let jwksCache: { keys: Array<JsonWebKey & { kid?: string }>; expiresAt: number } | null = null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function decodeBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJsonPart<T>(input: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(input))) as T;
}

async function getGitHubKeys(): Promise<Array<JsonWebKey & { kid?: string }>> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch('https://token.actions.githubusercontent.com/.well-known/jwks');
  if (!response.ok) throw new Error('Could not load GitHub OIDC signing keys.');
  const payload = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
  if (!Array.isArray(payload.keys)) throw new Error('GitHub OIDC signing keys were invalid.');
  jwksCache = { keys: payload.keys, expiresAt: Date.now() + 5 * 60_000 };
  return payload.keys;
}

async function verifyGitHubToken(token: string): Promise<JwtClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid identity token.');
  const header = decodeJsonPart<{ alg?: string; kid?: string }>(parts[0]);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported identity token.');
  const jwk = (await getGitHubKeys()).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Unknown GitHub signing key.');
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(parts[0] + '.' + parts[1]),
  );
  if (!valid) throw new Error('Invalid GitHub identity signature.');

  const claims = decodeJsonPart<JwtClaims>(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== 'https://token.actions.githubusercontent.com'
    || !audiences.includes(AUDIENCE)
    || typeof claims.exp !== 'number' || claims.exp <= now
    || typeof claims.iat !== 'number' || claims.iat > now + 60
    || (typeof claims.nbf === 'number' && claims.nbf > now)
    || claims.repository !== EXPECTED_REPOSITORY
    || String(claims.repository_id) !== EXPECTED_REPOSITORY_ID
    || typeof claims.workflow_ref !== 'string'
    || !claims.workflow_ref.startsWith(EXPECTED_WORKFLOW_PREFIX)
    || !['release', 'workflow_dispatch'].includes(String(claims.event_name))) {
    throw new Error('GitHub identity is not authorized for release email.');
  }
  return claims;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function serviceHeaders(serviceKey: string) {
  return { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
}

async function getRecipients(serviceKey: string): Promise<string[]> {
  const headers = serviceHeaders(serviceKey);
  const profilesUrl = PROJECT_URL + '/rest/v1/profiles?select=email&notify=eq.true&release_updates_opted_in_at=not.is.null&email=not.is.null&limit=1000';
  const waitlistUrl = PROJECT_URL + '/rest/v1/waitlist_emails?select=email&release_updates_opted_in_at=not.is.null&limit=1000';
  const [profilesResponse, waitlistResponse] = await Promise.all([
    fetch(profilesUrl, { headers }),
    fetch(waitlistUrl, { headers }),
  ]);
  if (!profilesResponse.ok || !waitlistResponse.ok) throw new Error('Could not load opted-in release recipients.');
  const [profiles, waitlist] = await Promise.all([profilesResponse.json(), waitlistResponse.json()]);
  const recipients = new Set<string>();
  for (const row of [...profiles, ...waitlist] as Array<{ email?: unknown }>) {
    if (typeof row.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      recipients.add(row.email.trim().toLowerCase());
    }
  }
  return [...recipients];
}

async function patchDelivery(
  serviceKey: string,
  releaseId: string,
  values: Record<string, unknown>,
  filter = '',
): Promise<boolean> {
  const url = PROJECT_URL + '/rest/v1/release_email_deliveries?release_id=eq.'
    + encodeURIComponent(releaseId) + filter;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...serviceHeaders(serviceKey),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error('Could not update release-email delivery state.');
  const rows = await response.json() as unknown[];
  return rows.length > 0;
}

async function claimRelease(serviceKey: string, releaseId: string, tag: string): Promise<boolean> {
  const response = await fetch(PROJECT_URL + '/rest/v1/release_email_deliveries', {
    method: 'POST',
    headers: {
      ...serviceHeaders(serviceKey),
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify({ release_id: releaseId, release_tag: tag, status: 'sending' }),
  });
  if (!response.ok) throw new Error('Could not reserve this release email.');
  const inserted = await response.json() as unknown[];
  if (inserted.length) return true;

  const existingUrl = PROJECT_URL + '/rest/v1/release_email_deliveries?release_id=eq.'
    + encodeURIComponent(releaseId) + '&select=status,attempt_count';
  const existingResponse = await fetch(existingUrl, { headers: serviceHeaders(serviceKey) });
  if (!existingResponse.ok) throw new Error('Could not check previous release-email delivery.');
  const [existing] = await existingResponse.json() as Array<{ status: string; attempt_count: number }>;
  if (!existing || existing.status !== 'failed') return false;
  return await patchDelivery(
    serviceKey,
    releaseId,
    { status: 'sending', attempt_count: existing.attempt_count + 1, error: null },
    '&status=eq.failed',
  );
}

async function markFailed(serviceKey: string, releaseId: string, error: unknown) {
  const message = error instanceof Error ? error.message.slice(0, 500) : 'Release email failed.';
  await patchDelivery(serviceKey, releaseId, { status: 'failed', error: message }, '&status=eq.sending');
}

async function sendReleaseEmail(release: Release, serviceKey: string) {
  const releaseId = String(release.id ?? '');
  const tag = (release.tag_name ?? '').trim();
  const releaseUrl = release.html_url ?? '';
  if (!/^\d+$/.test(releaseId) || !tag || tag.length > 120) throw new Error('Release metadata is incomplete.');
  const parsedUrl = new URL(releaseUrl);
  if (parsedUrl.origin !== 'https://github.com'
    || !parsedUrl.pathname.startsWith('/Hive-AI-APP/Hive-Public-Hive/releases/')) {
    throw new Error('Release URL did not match the public Hive repository.');
  }
  if (!await claimRelease(serviceKey, releaseId, tag)) return { duplicate: true };

  try {
    const recipients = await getRecipients(serviceKey);
    if (!recipients.length) throw new Error('There are no opted-in release recipients.');
    if (recipients.length > MAX_RECIPIENTS_PER_SEND) {
      throw new Error('The opted-in list exceeds the Gmail limit for one broadcast.');
    }
    const gmailUser = Deno.env.get('GMAIL_USER')?.trim().toLowerCase();
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
    if (gmailUser !== FROM_EMAIL || !gmailPassword) throw new Error('Gmail sender is not configured.');

    const title = (release.name || 'Hive ' + tag).trim().slice(0, 160);
    const subject = 'Hive ' + tag + ' is available';
    const notes = (release.body || '').trim().slice(0, 7000);
    const text = [
      title + ' is now available.',
      '',
      notes || 'See the release page for details.',
      '',
      'Get Hive and read the full release notes: ' + releaseUrl,
      '',
      'To unsubscribe, email ' + SUPPORT_EMAIL + ' with “unsubscribe” in the subject, or turn off release updates in your Hive profile.',
    ].join('\n');
    const safeTitle = escapeHtml(title);
    const safeNotes = escapeHtml(notes || 'See the release page for details.').replace(/\r?\n/g, '<br>');
    const safeUrl = escapeHtml(releaseUrl);
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPassword },
    });
    try {
      await transporter.sendMail({
        from: 'Hive <' + FROM_EMAIL + '>',
        to: FROM_EMAIL,
        bcc: recipients,
        replyTo: SUPPORT_EMAIL,
        subject,
        text,
        html: '<main style="max-width:640px;margin:0 auto;font:16px/1.6 Arial,sans-serif;color:#202124">'
          + '<h1 style="font-size:22px">' + safeTitle + '</h1><p>' + safeNotes + '</p>'
          + '<p><a href="' + safeUrl + '">Get Hive and read the full release notes</a></p><hr>'
          + '<p style="font-size:13px;color:#5f6368">To unsubscribe, <a href="mailto:' + SUPPORT_EMAIL
          + '?subject=Unsubscribe%20Hive%20release%20updates">email us with “unsubscribe” in the subject</a>, or '
          + '<a href="https://hivetools.pro/profile">turn off release updates in your Hive profile</a>.</p></main>',
        headers: { 'List-Unsubscribe': '<mailto:' + SUPPORT_EMAIL + '?subject=Unsubscribe%20Hive%20release%20updates>' },
      });
    } finally {
      await transporter.close();
    }

    await patchDelivery(serviceKey, releaseId, {
      status: 'sent',
      recipient_count: recipients.length,
      sent_at: new Date().toISOString(),
      error: null,
    }, '&status=eq.sending');
    return { sent: recipients.length, tag };
  } catch (error) {
    await markFailed(serviceKey, releaseId, error);
    throw error;
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  let serviceKey: string | undefined;
  let releaseId: string | null = null;
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: 'Missing GitHub identity token.' }, 401);
    const claims = await verifyGitHubToken(token);
    const body = await request.json() as ReleasePayload & { action?: string };

    if (claims.event_name === 'workflow_dispatch' && body.action === 'dry_run') {
      if (!claims.workflow_ref?.endsWith('@refs/heads/main')) {
        return json({ error: 'Dry runs must come from the default branch.' }, 403);
      }
      serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceKey) return json({ error: 'Email automation is not configured.' }, 503);
      const recipients = await getRecipients(serviceKey);
      return json({ dry_run: true, opted_in_recipients: recipients.length });
    }

    if (claims.event_name !== 'release'
      || body.action !== 'published'
      || !body.release
      || body.release.draft
      || body.release.prerelease) {
      return json({ skipped: true, reason: 'Only published stable releases are emailed.' });
    }
    const tag = (body.release.tag_name ?? '').trim();
    if (!tag || claims.ref !== 'refs/tags/' + tag) {
      return json({ error: 'Release tag did not match the verified GitHub event.' }, 403);
    }
    if (!claims.workflow_ref?.endsWith('@refs/heads/main')
      && !claims.workflow_ref?.endsWith('@refs/tags/' + tag)) {
      return json({ error: 'Release workflow reference did not match the published release.' }, 403);
    }
    serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) return json({ error: 'Email automation is not configured.' }, 503);
    releaseId = String(body.release.id ?? '');
    const result = await sendReleaseEmail(body.release, serviceKey);
    return json(result);
  } catch (error) {
    if (serviceKey && releaseId) {
      try { await markFailed(serviceKey, releaseId, error); } catch { /* Preserve the original delivery error. */ }
    }
    console.error('github-release-email failure:', error);
    return json({ error: 'The release email could not be delivered. Check the Edge Function logs.' }, 500);
  }
});
