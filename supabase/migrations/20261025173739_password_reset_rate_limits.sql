create table if not exists public.password_reset_rate_limits (
  email_hash text primary key check (email_hash ~ '^[0-9a-f]{64}$'),
  last_requested_at timestamptz not null,
  request_day date not null,
  requests_today smallint not null default 1 check (requests_today between 1 and 5)
);

alter table public.password_reset_rate_limits enable row level security;
revoke all on public.password_reset_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.password_reset_rate_limits to service_role;

create or replace function public.consume_password_reset_request(p_email_hash text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  utc_day date := (now() at time zone 'UTC')::date;
  consumed boolean := false;
begin
  if p_email_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  insert into public.password_reset_rate_limits as limits (
    email_hash, last_requested_at, request_day, requests_today
  ) values (
    p_email_hash, now(), utc_day, 1
  )
  on conflict (email_hash) do update
  set last_requested_at = now(),
      request_day = utc_day,
      requests_today = case
        when limits.request_day = utc_day then limits.requests_today + 1
        else 1
      end
  where (limits.request_day < utc_day or limits.last_requested_at <= now() - interval '60 seconds')
    and (limits.request_day < utc_day or limits.requests_today < 5)
  returning true into consumed;

  delete from public.password_reset_rate_limits
  where last_requested_at < now() - interval '30 days';

  return coalesce(consumed, false);
end;
$$;

revoke all on function public.consume_password_reset_request(text) from public, anon, authenticated;
grant execute on function public.consume_password_reset_request(text) to service_role;
