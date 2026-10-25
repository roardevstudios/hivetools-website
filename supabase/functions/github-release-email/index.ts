// Kept as a closed endpoint so a stale runner or manually replayed request
// cannot send email. Release mail is sent only by the signed-in admin flow.
Deno.serve(() => new Response(
  JSON.stringify({ error: 'Automatic GitHub release email is disabled.' }),
  {
    status: 410,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  },
));
