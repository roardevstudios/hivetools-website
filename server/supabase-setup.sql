-- ============================================================
-- HIVE BASE SETUP — run ONCE, and only when creating a NEW project.
--
-- ⚠️ NOT THE AUTHORITY FOR AN EXISTING DATABASE. ⚠️
--
-- This file is the BASE schema only. It is deliberately kept for fresh-project
-- setup, but re-running it against the live project (nqkmnmwbmikbgopwkvse)
-- REGRESSES security, because sections 1, 2 and 5 below still contain the
-- original permissive definitions:
--
--   * profiles.status default 'approved'  — every new signup would skip review
--   * is_hive_admin() matching '%samkomedved%' AND granted to anon
--   * "update own profile" / "own quota write" policies on profiles + quotas
--
-- Those were tightened by the desktop-side migrations. Running this file after
-- them restores the old behaviour. The order that is safe is:
--
--   1. this file                       (fresh project only)
--   2. HiveSOURCE/supabase/0001_sync_web_desktop.sql
--   3. HiveSOURCE/supabase/0002_public_beta.sql
--
-- To change something on the live database, write a new numbered migration in
-- HiveSOURCE/supabase/ instead of editing or re-running this file.
-- ============================================================

-- ---------- 1. PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'denied', 'suspended')),
  use_case text,
  referral_source text,
  profession text,
  ui_mode text,
  assistant_prefs text,
  customer_number serial unique,
  notify boolean not null default true,
  release_updates_opted_in_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select using (auth.uid() = id);
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---------- 2. ADMIN FLAG + HELPER ----------
update public.profiles
  set is_admin = true
  where email ilike '%samkomedved%';

create or replace function public.is_hive_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.is_admin or p.email ilike '%samkomedved%'
    from public.profiles p
    where p.id = auth.uid()
  ), false)
  or exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and coalesce(u.email, '') ilike '%samkomedved%'
  );
$$;
grant execute on function public.is_hive_admin() to anon, authenticated;

drop policy if exists "admin read profiles" on public.profiles;
create policy "admin read profiles"
  on public.profiles for select
  using (public.is_hive_admin());
drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles"
  on public.profiles for update
  using (public.is_hive_admin())
  with check (public.is_hive_admin());

drop policy if exists "public read basic profiles" on public.profiles;

create or replace function public.public_profile_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.profiles
  where status = 'approved';
$$;
revoke all on function public.public_profile_count() from public;
grant execute on function public.public_profile_count() to anon, authenticated;

-- ---------- 3. INSTALLER STORAGE + RELEASES ----------
insert into storage.buckets (id, name, public, file_size_limit)
  values ('installers', 'installers', true, 524288000)
  on conflict (id) do update
    set public = true,
        file_size_limit = 524288000;

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  notes text,
  filename text not null,
  file_path text not null,
  file_url text,
  file_size bigint,
  is_latest boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.releases enable row level security;
drop policy if exists "public read releases" on public.releases;
create policy "public read releases" on public.releases for select using (true);
drop policy if exists "admin write releases" on public.releases;
create policy "admin write releases" on public.releases for all
  using (public.is_hive_admin())
  with check (public.is_hive_admin());

drop policy if exists "public read installers" on storage.objects;
create policy "public read installers"
  on storage.objects for select
  using (bucket_id = 'installers');
drop policy if exists "admin write installers" on storage.objects;
create policy "admin write installers"
  on storage.objects for all
  using (bucket_id = 'installers' and public.is_hive_admin())
  with check (bucket_id = 'installers' and public.is_hive_admin());

-- ---------- 4. ACCESS CODES ----------
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  buyer_email text,
  order_id text,
  max_uses int not null default 1,
  use_count bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
alter table public.access_codes enable row level security;
drop policy if exists "admin write codes" on public.access_codes;
create policy "admin write codes" on public.access_codes for all
  using (public.is_hive_admin())
  with check (public.is_hive_admin());

-- Buyer claims one unclaimed code after PayPal capture.
create or replace function public.claim_access_code(p_order_id text, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare c public.access_codes%rowtype;
begin
  if p_order_id is null or p_order_id = '' then return null; end if;
  select * into c from public.access_codes where order_id = p_order_id limit 1;
  if found then return c.code; end if;
  select * into c from public.access_codes
    where is_active = true and claimed_at is null
    order by created_at limit 1
    for update skip locked;
  if not found then return null; end if;
  perform 1 from public.access_codes where order_id = p_order_id;
  if found then
    select code into c.code from public.access_codes where order_id = p_order_id limit 1;
    return c.code;
  end if;
  update public.access_codes
    set order_id = p_order_id, buyer_email = p_email, claimed_at = now()
    where id = c.id;
  return c.code;
end;
$$;
grant execute on function public.claim_access_code(text, text) to anon, authenticated;

-- Redeem a code for the installer URL. Counts one use per call.
create or replace function public.redeem_access_code(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare target_url text;
declare norm text;
begin
  norm := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if norm = '' then return null; end if;
  if not exists (
    select 1 from public.access_codes
    where code = norm and is_active = true
      and use_count < max_uses
  ) then return null; end if;
  update public.access_codes set use_count = use_count + 1
    where code = norm;
  select file_url into target_url from public.releases
    where is_latest = true order by created_at desc limit 1;
  if target_url is null then
    target_url := 'https://github.com/samkomedved319-dev/Hive-Desktop/releases/download/0.0.1.7.4/Hive-Setup-0.0.1.7.4.exe';
  end if;
  return target_url;
end;
$$;
grant execute on function public.redeem_access_code(text) to anon, authenticated;

-- Non-consuming validity check.
create or replace function public.check_access_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.access_codes
    where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
      and is_active = true
      and use_count < max_uses
  );
$$;
grant execute on function public.check_access_code(text) to anon, authenticated;

-- ---------- 5. QUOTAS ----------
create table if not exists public.usage_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  used bigint not null default 0,
  token_limit bigint not null default 50000,
  bonus bigint not null default 0,
  started_at timestamptz,
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.usage_quotas enable row level security;
drop policy if exists "own quota read" on public.usage_quotas;
create policy "own quota read"
  on public.usage_quotas for select
  using (auth.uid() = user_id or public.is_hive_admin());
drop policy if exists "own quota write" on public.usage_quotas;
create policy "own quota write"
  on public.usage_quotas for insert
  with check (auth.uid() = user_id or public.is_hive_admin());
drop policy if exists "own quota update" on public.usage_quotas;
create policy "own quota update"
  on public.usage_quotas for update
  using (auth.uid() = user_id or public.is_hive_admin())
  with check (auth.uid() = user_id or public.is_hive_admin());

-- ---------- 6. SUBSCRIPTIONS + UNLOCK + SESSIONS ----------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'plus' check (plan in ('plus', 'max')),
  paypal_subscription_id text,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "own sub read" on public.subscriptions;
create policy "own sub read" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_hive_admin());
drop policy if exists "own sub write" on public.subscriptions;
create policy "own sub write" on public.subscriptions
  for insert with check (auth.uid() = user_id or public.is_hive_admin());
drop policy if exists "own sub update" on public.subscriptions;
create policy "own sub update" on public.subscriptions
  for update using (auth.uid() = user_id or public.is_hive_admin())
  with check (auth.uid() = user_id or public.is_hive_admin());

create or replace function public.has_unlock(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.access_codes
    where buyer_email ilike coalesce(p_email, '')
      and claimed_at is not null
      and is_active = true
  );
$$;
grant execute on function public.has_unlock(text) to authenticated;

create table if not exists public.app_sessions (
  user_id uuid references auth.users(id) on delete cascade,
  install_id text not null,
  email text,
  app_version text,
  platform text not null default 'windows',
  country text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, install_id)
);
alter table public.app_sessions enable row level security;
drop policy if exists "own session write" on public.app_sessions;
create policy "own session write" on public.app_sessions
  for insert with check (auth.uid() = user_id or public.is_hive_admin());
drop policy if exists "own session update" on public.app_sessions;
create policy "own session update" on public.app_sessions
  for update using (auth.uid() = user_id or public.is_hive_admin())
  with check (auth.uid() = user_id or public.is_hive_admin());
drop policy if exists "admin session read" on public.app_sessions;
create policy "admin session read" on public.app_sessions
  for select using (public.is_hive_admin());

-- ---------- 7. SALES (custom pricing sales, controlled from /admin) ----------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Sale',
  unlock_price numeric not null default 0,
  plus_price numeric not null default 7.59,
  max_price numeric not null default 10.59,
  is_active boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sales enable row level security;
drop policy if exists "public read sales" on public.sales;
create policy "public read sales" on public.sales for select using (true);
drop policy if exists "admin write sales" on public.sales;
create policy "admin write sales" on public.sales for all
  using (public.is_hive_admin())
  with check (public.is_hive_admin());

-- Default sale: Unlock (basic) FREE. Activate by setting is_active = true
-- in /admin, or run: update public.sales set is_active = true where label = 'Launch free Unlock';
insert into public.sales (label, unlock_price, plus_price, max_price, is_active)
values ('Launch free Unlock', 0, 7.59, 10.59, false)
on conflict do nothing;

-- ---------- 8. CLAIM NOTIFICATIONS (who redeemed which code + receipt email) ----------
create table if not exists public.claim_notifications (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  email text,
  created_at timestamptz not null default now()
);
alter table public.claim_notifications enable row level security;
drop policy if exists "anon log claims" on public.claim_notifications;
create policy "anon log claims" on public.claim_notifications
  for insert with check (true);
drop policy if exists "admin read claims" on public.claim_notifications;
create policy "admin read claims" on public.claim_notifications
  for select using (public.is_hive_admin());
drop policy if exists "admin delete claims" on public.claim_notifications;
create policy "admin delete claims" on public.claim_notifications
  for delete using (public.is_hive_admin());

create or replace function public.admin_delete_user(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or not public.is_hive_admin() then
    return false;
  end if;
  delete from auth.users where id = p_user_id;
  return not exists (select 1 from auth.users where id = p_user_id);
end;
$$;
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  plan_interest text,
  release_updates_opted_in_at timestamptz,
  created_at timestamptz not null default now(),
  constraint waitlist_emails_plan_interest_check
    check (plan_interest is null or plan_interest in ('tokens_plus', 'token_max'))
);
alter table public.waitlist_emails add column if not exists plan_interest text;
alter table public.waitlist_emails add column if not exists release_updates_opted_in_at timestamptz;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.waitlist_emails'::regclass
      and conname = 'waitlist_emails_plan_interest_check'
  ) then
    alter table public.waitlist_emails
      add constraint waitlist_emails_plan_interest_check
      check (plan_interest is null or plan_interest in ('tokens_plus', 'token_max'));
  end if;
end $$;
alter table public.waitlist_emails enable row level security;
drop policy if exists "anyone insert waitlist email" on public.waitlist_emails;
drop policy if exists "opted-in waitlist insert or admin" on public.waitlist_emails;
create policy "opted-in waitlist insert or admin"
  on public.waitlist_emails for insert
  with check (release_updates_opted_in_at is not null or public.is_hive_admin());
drop policy if exists "admin read waitlist emails" on public.waitlist_emails;
create policy "admin read waitlist emails"
  on public.waitlist_emails for select using (public.is_hive_admin());

create or replace function public.subscribe_release_email(
  p_email text,
  p_plan_interest text default null,
  p_consent boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
begin
  if p_consent is distinct from true then
    raise exception 'release email consent is required' using errcode = '22023';
  end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'valid email required' using errcode = '22023';
  end if;
  if p_plan_interest is not null and p_plan_interest not in ('tokens_plus', 'token_max') then
    raise exception 'unknown plan interest' using errcode = '22023';
  end if;

  insert into public.waitlist_emails (email, plan_interest, release_updates_opted_in_at)
  values (normalized_email, p_plan_interest, now())
  on conflict (email) do update
    set plan_interest = coalesce(excluded.plan_interest, public.waitlist_emails.plan_interest),
        release_updates_opted_in_at = now();
  return true;
end;
$$;
revoke all on function public.subscribe_release_email(text, text, boolean) from public;
grant execute on function public.subscribe_release_email(text, text, boolean) to anon, authenticated;

create or replace function public.request_upgrade(p_email text, p_plan text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  normalized_plan text;
begin
  normalized_email := lower(trim(coalesce(p_email, '')));
  normalized_plan := case lower(trim(coalesce(p_plan, '')))
    when 'tokens_plus' then 'tokens_plus'
    when 'token_max' then 'token_max'
    else null
  end;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'valid email required' using errcode = '22023';
  end if;
  if normalized_plan is null then
    raise exception 'unknown upgrade plan' using errcode = '22023';
  end if;

  insert into public.waitlist_emails (email, plan_interest)
  values (normalized_email, normalized_plan)
  on conflict (email) do update
  set plan_interest = excluded.plan_interest;

  return true;
end;
$$;
revoke all on function public.request_upgrade(text, text) from public;
grant execute on function public.request_upgrade(text, text) to anon, authenticated;

-- ---------- 9. ONBOARDING + SUSPEND ----------
-- Run this block if you already set up the DB (new installs get it automatically).
alter table public.profiles add column if not exists use_case text;
alter table public.profiles add column if not exists referral_source text;
alter table public.profiles add column if not exists profession text;
alter table public.profiles add column if not exists ui_mode text;
alter table public.profiles add column if not exists assistant_prefs text;
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('pending', 'approved', 'denied', 'suspended'));
