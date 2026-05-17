-- Reparacion/migracion: login propio de la app, sin Supabase Auth.
-- Deja las tablas accesibles con anon key para que el sistema pueda validar
-- usuarios y contrasenas desde public.usuarios.

alter table public.usuarios drop constraint if exists usuarios_id_fkey;
alter table public.usuarios add column if not exists password text not null default '';
alter table public.usuarios drop column if exists email;
alter table public.clientes drop column if exists email;
delete from public.configuracion where clave = 'negocio_email';

drop policy if exists configuracion_select_authenticated on public.configuracion;
drop policy if exists configuracion_admin_write on public.configuracion;
drop policy if exists catalogo_select_authenticated on public.catalogo;
drop policy if exists catalogo_admin_write on public.catalogo;
drop policy if exists usuarios_select_self_or_admin on public.usuarios;
drop policy if exists usuarios_admin_insert on public.usuarios;
drop policy if exists usuarios_admin_update on public.usuarios;
drop policy if exists usuarios_admin_delete on public.usuarios;
drop policy if exists clientes_active_all on public.clientes;
drop policy if exists cotizaciones_active_all on public.cotizaciones;
drop policy if exists pedidos_active_all on public.pedidos;
drop policy if exists configuracion_anon_all on public.configuracion;
drop policy if exists usuarios_anon_all on public.usuarios;
drop policy if exists catalogo_anon_all on public.catalogo;
drop policy if exists clientes_anon_all on public.clientes;
drop policy if exists cotizaciones_anon_all on public.cotizaciones;
drop policy if exists pedidos_anon_all on public.pedidos;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();
drop function if exists public.is_active_user();
drop function if exists public.is_admin();

update public.usuarios
set password = 'admin123'
where rol = 'admin'
  and (password is null or btrim(password) = '');

update public.usuarios
set usuario = 'admin'
where rol = 'admin'
  and (usuario is null or btrim(usuario) = '' or position('@' in usuario) > 0)
  and not exists (
    select 1 from public.usuarios u2 where lower(u2.usuario) = 'admin'
  );

insert into public.usuarios (nombre, usuario, password, rol, activo)
select 'Administrador General', 'admin', 'admin123', 'admin', 1
where not exists (
  select 1 from public.usuarios where lower(usuario) = 'admin'
);

alter table public.configuracion enable row level security;
alter table public.usuarios enable row level security;
alter table public.catalogo enable row level security;
alter table public.clientes enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.pedidos enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on table public.configuracion, public.usuarios, public.catalogo, public.clientes, public.cotizaciones, public.pedidos to anon;
grant usage, select on all sequences in schema public to anon;

create policy configuracion_anon_all on public.configuracion for all to anon using (true) with check (true);
create policy usuarios_anon_all on public.usuarios for all to anon using (true) with check (true);
create policy catalogo_anon_all on public.catalogo for all to anon using (true) with check (true);
create policy clientes_anon_all on public.clientes for all to anon using (true) with check (true);
create policy cotizaciones_anon_all on public.cotizaciones for all to anon using (true) with check (true);
create policy pedidos_anon_all on public.pedidos for all to anon using (true) with check (true);

alter table public.configuracion replica identity full;
alter table public.usuarios replica identity full;
alter table public.catalogo replica identity full;
alter table public.clientes replica identity full;
alter table public.cotizaciones replica identity full;
alter table public.pedidos replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.configuracion;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.usuarios;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.catalogo;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.clientes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.cotizaciones;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.pedidos;
exception when duplicate_object then null;
end $$;
