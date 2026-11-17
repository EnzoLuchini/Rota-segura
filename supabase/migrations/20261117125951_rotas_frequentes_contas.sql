-- Rotas de cada conta; visitante continua no armazenamento local.
create table public.saved_routes (
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id text not null,
  route jsonb not null check (jsonb_typeof(route) = 'object' and coalesce(route->>'id' = route_id, false)),
  primary key (user_id, route_id)
);
alter table public.saved_routes enable row level security;
revoke all on public.saved_routes from public, anon, authenticated;
grant select, insert, update, delete on public.saved_routes to authenticated;
create policy "Titular consulta rotas" on public.saved_routes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Titular cria rotas" on public.saved_routes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Titular altera rotas" on public.saved_routes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Titular remove rotas" on public.saved_routes for delete to authenticated using ((select auth.uid()) = user_id);
