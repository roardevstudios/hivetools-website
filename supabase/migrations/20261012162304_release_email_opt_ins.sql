-- Track affirmative consent separately from the legacy notify preference.
alter table public.profiles
  add column if not exists release_updates_opted_in_at timestamptz;

alter table public.waitlist_emails
  add column if not exists release_updates_opted_in_at timestamptz;

-- A public waitlist insert must include affirmative release-email consent.
drop policy if exists "anyone insert waitlist email" on public.waitlist_emails;
create policy "opted-in waitlist insert or admin"
  on public.waitlist_emails for insert
  with check (
    release_updates_opted_in_at is not null
    or public.is_hive_admin()
  );
