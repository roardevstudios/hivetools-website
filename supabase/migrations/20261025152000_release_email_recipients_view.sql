create or replace view public.release_email_recipients
with (security_invoker = true)
as
  select lower(btrim(p.email)) as email
  from public.profiles p
  where p.email is not null
    and p.release_updates_opted_in_at is not null
    and p.notify is distinct from false

  union

  select lower(btrim(w.email)) as email
  from public.waitlist_emails w
  where w.email is not null
    and w.release_updates_opted_in_at is not null;

revoke all on public.release_email_recipients from public, anon, authenticated;
grant select on public.release_email_recipients to service_role;
