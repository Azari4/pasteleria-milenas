# Milena's Pasteleria - Sistema de Cotizaciones

Aplicacion web para cotizaciones, pedidos, clientes, reportes y configuracion.

## Cambios implementados

- Login propio del sistema con usuario y contrasena guardada en `public.usuarios`.
- Supabase Auth ya no se usa para iniciar sesion ni para crear empleados.
- RLS queda activo con politicas para la `anon public key`, evitando el estado `unrestricted`.
- Realtime queda activado para `configuracion`, `usuarios`, `catalogo`, `clientes`, `cotizaciones` y `pedidos`.
- `usuarios` guarda nombre, usuario, rol, estado y contrasena visible/editable desde la app.
- Se mantiene WhatsApp como identificador obligatorio del cliente y no se usa DNI.
- Se conservan los estados: `Nueva`, `En seguimiento`, `Cerrada (venta)`, `Perdida`.

## Configurar Supabase desde cero

1. Crea el proyecto en Supabase.
2. Abre `SQL Editor` y ejecuta completo `supabase-schema.sql`.
3. Ve a `Project Settings > API` y copia `Project URL` y `anon public key`.
4. Configura esos valores en `js/database.js`:

```js
const SUPABASE_URL = window.MILENAS_SUPABASE_URL || 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = window.MILENAS_SUPABASE_ANON_KEY || 'TU-ANON-KEY';
```

Tambien puedes definir `window.MILENAS_SUPABASE_URL` y `window.MILENAS_SUPABASE_ANON_KEY` antes de cargar `js/database.js`.

## Crear el primer administrador

Despues de ejecutar `supabase-schema.sql`:

El SQL crea un administrador inicial:

- Usuario: `admin`
- Contrasena: `admin123`

Puedes cambiar esos datos desde `Configuracion > Usuarios` al entrar.

## Usuarios nuevos desde la app

1. Entra a la app con un usuario `admin`.
2. Ve a `Configuracion > Usuarios > Nuevo Usuario`.
3. Completa nombre, usuario, rol y contrasena.

El administrador puede ver y editar todas las contrasenas desde la tabla de usuarios.

## RLS y Realtime

`supabase-schema.sql` deja RLS activo con politicas para `anon` y agrega las tablas a `supabase_realtime`.

Si necesitas verificarlo, ejecuta `supabase-rls-fix.sql`; reafirma RLS, politicas para `anon`, replica identity y publicacion realtime.

## Dependencias

No hay dependencias npm obligatorias. La app usa CDN:

- `sql.js`
- `@supabase/supabase-js`
- `Chart.js`
- `Lucide Icons`
- `html2pdf.js`

Para probar localmente:

```bash
npx serve .
```
