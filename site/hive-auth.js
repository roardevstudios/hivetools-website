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
  var desktopRequested = query.get('desktop') === '1' && query.get('proto') === '2';
  var pendingDesktopSession = null;
  var desktopHandoffStarted = false;

  if (desktopRequested) {
    try { sessionStorage.setItem('hive_desktop_login', '1'); } catch (_) {}
  }

  function wantsDesktopApp() {
    if (desktopRequested) return true;
    try { return sessionStorage.getItem('hive_desktop_login') === '1'; } catch (_) { return false; }
  }

  function finishDesktopLogin(session) {
    if (!wantsDesktopApp() || !session || !session.access_token || !session.refresh_token) return false;
    if (document.readyState === 'loading') {
      pendingDesktopSession = session;
      return true;
    }
    if (desktopHandoffStarted) return true;
    desktopHandoffStarted = true;

    var params = new URLSearchParams({ access_token: session.access_token, refresh_token: session.refresh_token });
    var appUrl = 'hive://auth/#' + params.toString();
    var handoff = document.getElementById('desktop-handoff');
    var link = document.getElementById('desktop-app-link');
    if (link) link.href = appUrl;
    if (handoff) handoff.hidden = false;
    var message = document.getElementById('auth-msg');
    if (message) message.textContent = 'Sign-in complete. Opening Hive…';
    try { sessionStorage.removeItem('hive_desktop_login'); } catch (_) {}
    window.setTimeout(function () { window.location.href = appUrl; }, 150);
    return true;
  }

  window.hiveFinishDesktopLogin = finishDesktopLogin;
  document.addEventListener('DOMContentLoaded', function () {
    if (pendingDesktopSession) finishDesktopLogin(pendingDesktopSession);
  }, { once: true });

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
    if (!session || !session.user) return;
    if (wantsDesktopApp() && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      if (isOAuthCallback && event === 'SIGNED_IN') {
        window.setTimeout(async function () {
          try {
            await client.from('profiles').upsert(
              { id: session.user.id, email: session.user.email },
              { onConflict: 'id' }
            );
          } catch (_) {}
          finishDesktopLogin(session);
        }, 0);
      } else {
        window.setTimeout(function () { finishDesktopLogin(session); }, 0);
      }
      return;
    }
    if (!isOAuthCallback || event !== 'SIGNED_IN' || redirected) return;
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
