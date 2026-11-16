-- Only the server's service role can access push subscriptions or routes.
create table public.push_devices (
  id uuid primary key,
  token_hash text not null,
  subscription jsonb not null,
  routes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.push_devices enable row level security;
revoke all on public.push_devices from public, anon, authenticated;
grant select, insert, update, delete on public.push_devices to service_role;
create index push_devices_updated_at_idx on public.push_devices(updated_at);

create table public.push_deliveries (
  device_id uuid not null references public.push_devices(id) on delete cascade,
  delivery_key text not null,
  created_at timestamptz not null default now(),
  primary key (device_id, delivery_key)
);
alter table public.push_deliveries enable row level security;
revoke all on public.push_deliveries from public, anon, authenticated;
grant select, insert, delete on public.push_deliveries to service_role;
create index push_deliveries_created_at_idx on public.push_deliveries(created_at);
