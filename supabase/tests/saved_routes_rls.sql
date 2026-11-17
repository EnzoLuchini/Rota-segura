begin;
insert into auth.users (id) values ('d6d2d671-712f-4f42-86f7-d93e6bf28001'), ('d6d2d671-712f-4f42-86f7-d93e6bf28002');
insert into public.saved_routes(user_id,route_id,route) values
 ('d6d2d671-712f-4f42-86f7-d93e6bf28001','a','{"id":"a","name":"A"}'),
 ('d6d2d671-712f-4f42-86f7-d93e6bf28002','b','{"id":"b","name":"B"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','d6d2d671-712f-4f42-86f7-d93e6bf28001',true);
select set_config('request.jwt.claims','{"sub":"d6d2d671-712f-4f42-86f7-d93e6bf28001","role":"authenticated"}',true);
do $$
declare affected integer;
begin
 if (select count(*) from public.saved_routes) <> 1 then raise exception 'Falha no isolamento de leitura'; end if;
 update public.saved_routes set route='{"id":"b","name":"alterada"}' where route_id='b';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Foi possível alterar rota de outra conta'; end if;
 delete from public.saved_routes where route_id='b';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Foi possível excluir rota de outra conta'; end if;
 begin
  insert into public.saved_routes(user_id,route_id,route) values ('d6d2d671-712f-4f42-86f7-d93e6bf28002','c','{"id":"c"}');
  raise exception 'Foi possível criar rota para outra conta';
 exception when insufficient_privilege then null;
 end;
 update public.saved_routes set route='{"id":"a","name":"alterada"}' where route_id='a';
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'Não foi possível alterar rota própria'; end if;
end $$;
rollback;
