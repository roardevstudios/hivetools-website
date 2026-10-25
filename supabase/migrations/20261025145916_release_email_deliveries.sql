create table if not exists public.release_email_deliveries (
  release_id text primary key,
  release_tag text not null unique,
  status text not null default 'sending'
    check (status in ('sending', 'sent', 'failed')),
  recipient_count integer,
  attempt_count integer not null default 1,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.release_email_deliveries enable row level security;
revoke all on public.release_email_deliveries from public, anon, authenticated;
grant select, insert, update on public.release_email_deliveries to service_role;
