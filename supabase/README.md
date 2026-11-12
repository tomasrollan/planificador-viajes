# Backend (Supabase)

Proyecto: `xshmnkzbjjdqwslutslh` (São Paulo). Todo es por agencia: cada fila lleva `agency_id` y las políticas RLS solo dejan ver las agencias del usuario.

- `migrations/` — esquema en orden. Se aplican con el MCP de Supabase o `supabase db push`.
  - `0001_base`: tablas (`agencies`, `agency_members`, `agency_invites`, `records`, `portal_attempts`), funciones (`my_agencies`, `claim_invites`, `push_records`), RLS y el bucket privado `comprobantes`.
  - `0002_cerrar_permisos`: saca los permisos amplios que Supabase da por defecto; deja solo lo necesario.
- `functions/portal/` — Edge Function del portal del cliente (`verify_jwt` apagado: valida link + PIN ella misma).
  - `core.mjs` tiene la lógica pura (lista blanca de lo que ve y lo que puede guardar el cliente, límite de intentos). Está probada con `tests/portalcore.test.js`. Al desplegar hay que subir `index.ts` **y** `core.mjs`.

## Cómo entra la gente
1. Authentication → Sign In / Providers → Email: **desactivar «Allow new users to sign up»**.
2. Authentication → URL Configuration → **Site URL** = dirección de la app.
3. Authentication → Users → **Invite user** (la persona elige su contraseña) o **Add user** con contraseña y «Auto Confirm».
4. Autorizar el mail a una agencia: `insert into agency_invites (email, agency_id, role) values ('mail@dominio.com','ag_default','owner');` (en minúsculas). Al iniciar sesión por primera vez, la app reclama la invitación.

## Secretos
La clave `publishable` (en `config/cloud.json`) es pública por diseño. La `service role key` solo existe dentro de Supabase (la función la recibe como variable de entorno): **nunca** va al repo ni al chat.

## Notas
- Los registros no se borran de verdad (borrado lógico, `deleted = true`); la app no tiene permiso de DELETE.
- Los comprobantes se suben a `comprobantes/{agency_id}/{id}`; la app no borra archivos de la nube (quedan como resguardo).
- Después de cambiar el esquema, correr los avisos de seguridad (`get_advisors`). Quedan dos avisos esperados: `claim_invites` y `my_agencies` son SECURITY DEFINER y las puede llamar un usuario con sesión (solo devuelven datos propios), y dos tablas sin políticas a propósito (`agency_invites`, `portal_attempts`: solo las toca el servidor).
