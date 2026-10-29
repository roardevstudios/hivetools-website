-- APP LOGIN CODE: the desktop app shows a 6-digit code; the signed-in website approves it.
-- Run once in the Supabase SQL editor. Rows are short-lived and never readable by clients.

create table if not exists public.app_login_requests (
  code text primary key,
  poll_secret text not null,
  user_id uuid references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.app_login_requests enable row level security;
-- No policies: clients reach this table only through the functions below.

-- App: create a pending request. Returns the expiry time.
create or replace function public.app_login_start(p_code text, p_poll_secret text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires timestamptz := now() + interval '5 minutes';
begin
  if p_code !~ '^[0-9]{6}$' or length(coalesce(p_poll_secret, '')) < 32 then
    raise exception 'Invalid login request.';
  end if;
  delete from public.app_login_requests where expires_at < now();
  insert into public.app_login_requests (code, poll_secret, expires_at)
  values (p_code, p_poll_secret, v_expires)
  on conflict (code) do update
     set poll_secret = excluded.poll_secret, user_id = null,
         access_token = null, refresh_token = null, expires_at = excluded.expires_at;
  return v_expires;
end;
$$;

-- Website: a signed-in user approves a code and hands over their session.
create or replace function public.app_login_approve(p_code text, p_access_token text, p_refresh_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in on the website first.';
  end if;
  update public.app_login_requests
     set user_id = auth.uid(), access_token = p_access_token, refresh_token = p_refresh_token
   where code = p_code and user_id is null and expires_at > now();
  if not found then
    raise exception 'Code not found or expired. Check the code in the app.';
  end if;
  return true;
end;
$$;

-- App: poll. Returns pending / approved (with tokens, one time) / expired.
create or replace function public.app_login_status(p_code text, p_poll_secret text)
returns table (status text, access_token text, refresh_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.app_login_requests%rowtype;
begin
  select * into r from public.app_login_requests
   where code = p_code and poll_secret = p_poll_secret;
  if not found or r.expires_at <= now() then
    return query select 'expired'::text, null::text, null::text;
    return;
  end if;
  if r.user_id is null then
    return query select 'pending'::text, null::text, null::text;
    return;
  end if;
  delete from public.app_login_requests where code = p_code;
  return query select 'approved'::text, r.access_token, r.refresh_token;
end;
$$;

revoke all on function public.app_login_start(text, text) from public;
revoke all on function public.app_login_approve(text, text, text) from public;
revoke all on function public.app_login_status(text, text) from public;
grant execute on function public.app_login_start(text, text) to anon, authenticated;
grant execute on function public.app_login_status(text, text) to anon, authenticated;
grant execute on function public.app_login_approve(text, text, text) to authenticated;
