-- Limpieza de duplicados en catalogo.
-- Conserva la fila mas antigua de cada combinacion categoria + nombre
-- y elimina las copias posteriores.

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(categoria)), lower(btrim(nombre))
      order by id asc
    ) as rn
  from public.catalogo
)
delete from public.catalogo c
using ranked r
where c.id = r.id
  and r.rn > 1;

create unique index if not exists catalogo_categoria_nombre_unique
on public.catalogo (lower(btrim(categoria)), lower(btrim(nombre)));

-- Verificacion: debe devolver cero filas.
select
  categoria,
  nombre,
  count(*) as cantidad,
  array_agg(id order by id) as ids
from public.catalogo
group by lower(btrim(categoria)), lower(btrim(nombre)), categoria, nombre
having count(*) > 1
order by categoria, nombre;
