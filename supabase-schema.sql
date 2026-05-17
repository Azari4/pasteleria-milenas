-- Milena's Pasteleria - Supabase DB + login propio + Realtime
-- Ejecutar completo en Supabase SQL Editor.

create table if not exists public.configuracion (
  clave text primary key,
  valor text
);

create table if not exists public.catalogo (
  id bigserial primary key,
  categoria text not null,
  nombre text not null,
  precio numeric(12,2) not null default 0,
  descripcion text,
  emoji text,
  activo integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id bigserial primary key,
  nombre text not null,
  whatsapp text not null unique,
  direccion text,
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists public.cotizaciones (
  id bigserial primary key,
  numero text not null,
  cliente_id bigint,
  cliente_nombre text,
  cliente_whatsapp text,
  tamano integer,
  precio_tamano numeric(12,2) not null default 0,
  sabor text,
  precio_sabor numeric(12,2) not null default 0,
  diseno text,
  precio_diseno numeric(12,2) not null default 0,
  extras text,
  observaciones text,
  total numeric(12,2) not null default 0,
  estado text not null default 'Nueva' check (estado in ('Nueva', 'En seguimiento', 'Cerrada (venta)', 'Perdida')),
  usuario_id text,
  usuario_nombre text,
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id bigserial primary key,
  numero text not null,
  cotizacion_id bigint,
  cliente_id bigint,
  cliente_nombre text,
  cliente_whatsapp text,
  descripcion text,
  fecha_entrega date,
  hora_entrega time,
  estado text not null default 'en_preparacion',
  total numeric(12,2) not null default 0,
  anticipo numeric(12,2) not null default 0,
  saldo_pendiente numeric(12,2) not null default 0,
  notas text,
  created_at timestamptz not null default now()
);

-- Usuarios del sistema. El login es propio de la app, sin Supabase Auth.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'usuarios'
      and column_name = 'id'
      and udt_name <> 'uuid'
  ) then
    drop table public.usuarios cascade;
  end if;
end $$;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  usuario text unique,
  password text not null default '',
  rol text not null default 'vendedor' check (rol in ('admin', 'vendedor', 'decorador', 'pastelero')),
  activo integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.usuarios drop constraint if exists usuarios_id_fkey;
alter table public.cotizaciones add column if not exists cliente_whatsapp text;
alter table public.pedidos add column if not exists cliente_whatsapp text;
alter table public.usuarios add column if not exists usuario text;
alter table public.usuarios add column if not exists password text not null default '';
alter table public.usuarios drop column if exists email;
alter table public.clientes drop column if exists email;
alter table public.cotizaciones alter column usuario_id type text using usuario_id::text;

insert into public.configuracion (clave, valor) values
  ('negocio_nombre', 'Milena''s Pasteleria'),
  ('negocio_subtitulo', 'Pasteles personalizados'),
  ('negocio_whatsapp', ''),
  ('negocio_direccion', ''),
  ('moneda_simbolo', 'Q.'),
  ('moneda_nombre', 'Quetzal'),
  ('whatsapp_mensaje', 'Hola, te comparto la cotizacion de tu pedido:')
on conflict (clave) do nothing;

insert into public.catalogo (categoria, nombre, precio, descripcion, emoji) values
  ('tamano', '10', 120, '10 porciones', 'cake'),
  ('tamano', '20', 220, '20 porciones', 'cake'),
  ('tamano', '30', 320, '30 porciones', 'cake'),
  ('sabor', 'Vainilla', 0, '', ''),
  ('sabor', 'Chocolate', 15, '', ''),
  ('sabor', 'Red velvet', 25, '', ''),
  ('diseno', 'Basico', 0, '', ''),
  ('diseno', 'Personalizado', 60, '', ''),
  ('decoracion', 'Topper acrílico', 15, '', ''),
  ('decoracion', 'Hoja de arroz impresa', 35, '', ''),
  ('decoracion', 'Perlas', 10, '', ''),
  ('decoracion', 'Flores de crema', 15, '', ''),
  ('decoracion', 'Chispas de colores', 10, '', ''),
  ('fondant', 'Pequeña (1 figura)', 30, '', ''),
  ('fondant', 'Mediana (1 figura)', 50, '', ''),
  ('fondant', 'Grande (1 figura)', 80, '', ''),
  ('fondant', 'Figura adicional', 30, '', ''),
  ('extras', 'Nombre personalizado', 10, '', ''),
  ('extras', 'Número', 15, '', ''),
  ('extras', 'Velas especiales', 10, '', ''),
  ('extras', 'Entrega urgente', 30, '', '')
on conflict do nothing;

delete from public.configuracion where clave = 'negocio_email';

insert into public.usuarios (nombre, usuario, password, rol, activo)
values ('Administrador General', 'admin', 'admin123', 'admin', 1)
on conflict (usuario) do nothing;

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

with ranked_catalogo as (
  select
    id,
    row_number() over (
      partition by lower(btrim(categoria)), lower(btrim(nombre))
      order by id asc
    ) as rn
  from public.catalogo
)
delete from public.catalogo c
using ranked_catalogo r
where c.id = r.id
  and r.rn > 1;

create unique index if not exists catalogo_categoria_nombre_unique
on public.catalogo (lower(btrim(categoria)), lower(btrim(nombre)));

-- Privacidad: eliminar DNI y usar WhatsApp como identificador obligatorio.
update public.clientes
set whatsapp = 'sin-whatsapp-' || id::text
where whatsapp is null or btrim(whatsapp) = '';

with repetidos as (
  select id, whatsapp, row_number() over (partition by whatsapp order by id) as rn
  from public.clientes
)
update public.clientes c
set whatsapp = c.whatsapp || '-' || c.id::text
from repetidos r
where c.id = r.id and r.rn > 1;

alter table public.clientes drop column if exists dni;
alter table public.clientes alter column whatsapp set not null;
create unique index if not exists clientes_whatsapp_unique on public.clientes (whatsapp);

update public.cotizaciones c
set cliente_whatsapp = cl.whatsapp
from public.clientes cl
where c.cliente_id = cl.id
  and (c.cliente_whatsapp is null or btrim(c.cliente_whatsapp) = '');

update public.pedidos p
set cliente_whatsapp = coalesce(c.cliente_whatsapp, cl.whatsapp)
from public.cotizaciones c
left join public.clientes cl on cl.id = c.cliente_id
where p.cotizacion_id = c.id
  and (p.cliente_whatsapp is null or btrim(p.cliente_whatsapp) = '');

update public.cotizaciones set estado = 'Nueva' where estado = 'pendiente';
update public.cotizaciones set estado = 'En seguimiento' where estado = 'enviada';
update public.cotizaciones set estado = 'Cerrada (venta)' where estado = 'aceptada';
update public.cotizaciones set estado = 'Perdida' where estado = 'rechazada';

-- Permisos para login propio de la app.
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

drop function if exists public.is_active_user();
drop function if exists public.is_admin();

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

-- Realtime.
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

-- Login propio de la app: el frontend usa la anon key para leer/escribir estas tablas.
-- Por pedido del cliente, las contrasenas quedan visibles/editables en public.usuarios.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();
