/* One Supabase auth client shared by the marketing site and account pages. */
(function () {
  if (!window.supabase || window.hiveSupabase) return;

  var client;
  try {
    client = window.supabase.createClient(
      'https://nqkmnmwbmikbgopwkvse.supabase.co',
      'sb_publishable_p5TvTFyNO0-kS5yUQSkRXw_GBSsHec4',
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } }
    );
  } catch (error) {
    console.error('Hive account sign-in could not initialize.', error);
    return;
  }

  window.hiveSupabase = client;

  var query = new URLSearchParams(window.location.search);
  var isOAuthCallback = window.location.pathname.replace(/\/$/, '') === '/auth' && query.get('mode') === 'oauth';
  var redirected = false;

  function destination() {
    var next = query.get('next');
    if (!next) {
      try {
        next = sessionStorage.getItem('hive_auth_next');
        sessionStorage.removeItem('hive_auth_next');
      } catch (_) {}
    }
    return next && next.charAt(0) === '/' && next.charAt(1) !== '/' ? next : '/profile';
  }

  client.auth.onAuthStateChange(function (event, session) {
    if (!isOAuthCallback || event !== 'SIGNED_IN' || !session || !session.user || redirected) return;
    redirected = true;

    // Defer Supabase data calls until after its auth callback has returned.
    window.setTimeout(async function () {
      try {
        await client.from('profiles').upsert(
          { id: session.user.id, email: session.user.email },
          { onConflict: 'id' }
        );
      } catch (_) {}
      window.location.replace(destination());
    }, 0);
  });
})();
