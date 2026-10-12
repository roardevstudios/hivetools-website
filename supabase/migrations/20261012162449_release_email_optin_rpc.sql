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
