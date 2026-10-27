-- EARLY ACCESS: invite codes + per-account grants.
-- Run once in the Supabase SQL editor. Needs is_hive_admin() from supabase-setup.sql.
-- Clients never read these tables directly. All access goes through the functions below.

-- ---------- 1. TABLES ----------
create table if not exists public.early_access_codes (
  code text primary key,
  note text,
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.early_access_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  source text not null default 'manual' check (source in ('manual', 'code')),
  granted_at timestamptz not null default now()
);

alter table public.early_access_codes enable row level security;
alter table public.early_access_grants enable row level security;
-- No policies: anon and authenticated roles cannot read or write these tables directly.

-- ---------- 2. CLIENT FUNCTIONS ----------
-- Is the signed-in account granted early access?
create or replace function public.has_early_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.early_access_grants where user_id = auth.uid());
$$;

-- Redeem an invite code for the signed-in account.
create or replace function public.redeem_early_access_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if exists (select 1 from public.early_access_grants where user_id = auth.uid()) then
    return true;
  end if;
  update public.early_access_codes
     set uses = uses + 1
   where code = v_code and active and uses < max_uses;
  if not found then
    raise exception 'Code is not valid or is already used up.';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into public.early_access_grants (user_id, email, source)
  values (auth.uid(), v_email, 'code')
  on conflict (user_id) do nothing;
  return true;
end;
$$;

-- ---------- 3. ADMIN FUNCTIONS ----------
create or replace function public.admin_grant_early_access(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if not public.is_hive_admin() then
    raise exception 'Admins only.';
  end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(coalesce(p_email, '')));
  if v_uid is null then
    raise exception 'No account with that email.';
  end if;
  insert into public.early_access_grants (user_id, email, source)
  values (v_uid, lower(trim(p_email)), 'manual')
  on conflict (user_id) do nothing;
  return true;
end;
$$;

create or replace function public.admin_revoke_early_access(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_hive_admin() then
    raise exception 'Admins only.';
  end if;
  delete from public.early_access_grants where user_id = p_user_id;
  return true;
end;
$$;

create or replace function public.admin_create_early_access_code(p_code text, p_note text, p_max_uses integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if not public.is_hive_admin() then
    raise exception 'Admins only.';
  end if;
  if v_code = '' then
    v_code := 'HIVE-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 10));
  end if;
  insert into public.early_access_codes (code, note, max_uses)
  values (v_code, nullif(trim(coalesce(p_note, '')), ''), greatest(coalesce(p_max_uses, 1), 1));
  return v_code;
end;
$$;

create or replace function public.admin_set_early_access_code_active(p_code text, p_active boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_hive_admin() then
    raise exception 'Admins only.';
  end if;
  update public.early_access_codes set active = p_active where code = upper(trim(p_code));
  return found;
end;
$$;

create or replace function public.admin_list_early_access()
returns table (user_id uuid, email text, source text, granted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_hive_admin() then
    raise exception 'Admins only.';
  end if;
  return query
    select g.user_id, g.email, g.source, g.granted_at
      from public.early_access_grants g
     order by g.granted_at desc;
end;
$$;

create or replace function public.admin_list_early_access_codes()
returns table (code text, note text, max_uses integer, uses integer, active boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_hive_admin() then
    raise exception 'Admins only.';
  end if;
  return query
    select c.code, c.note, c.max_uses, c.uses, c.active, c.created_at
      from public.early_access_codes c
     order by c.created_at desc;
end;
$$;

-- ---------- 4. GRANTS ----------
revoke all on function public.has_early_access() from public;
revoke all on function public.redeem_early_access_code(text) from public;
revoke all on function public.admin_grant_early_access(text) from public;
revoke all on function public.admin_revoke_early_access(uuid) from public;
revoke all on function public.admin_create_early_access_code(text, text, integer) from public;
revoke all on function public.admin_set_early_access_code_active(text, boolean) from public;
revoke all on function public.admin_list_early_access() from public;
revoke all on function public.admin_list_early_access_codes() from public;

grant execute on function public.has_early_access() to authenticated;
grant execute on function public.redeem_early_access_code(text) to authenticated;
grant execute on function public.admin_grant_early_access(text) to authenticated;
grant execute on function public.admin_revoke_early_access(uuid) to authenticated;
grant execute on function public.admin_create_early_access_code(text, text, integer) to authenticated;
grant execute on function public.admin_set_early_access_code_active(text, boolean) to authenticated;
grant execute on function public.admin_list_early_access() to authenticated;
grant execute on function public.admin_list_early_access_codes() to authenticated;
