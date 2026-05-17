-- Agrega contacto directo en cotizaciones/pedidos.
-- Necesario para cotizaciones sin cliente guardado.

alter table public.cotizaciones add column if not exists cliente_whatsapp text;
alter table public.pedidos add column if not exists cliente_whatsapp text;

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
