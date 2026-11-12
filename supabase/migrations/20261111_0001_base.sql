-- Planificador de viajes: base multi-agencia.
-- Regla de oro: toda fila lleva agency_id y las políticas RLS dejan ver solo las agencias a las que pertenece el usuario.

create table public.agencies (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.agency_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  agency_id text not null references public.agencies(id) on delete cascade,
  role text not null default 'agent' check (role in ('owner','agent')),
  email text,
  created_at timestamptz not null default now(),
  primary key (user_id, agency_id)
);

-- Mails autorizados a entrar a una agencia. Se cargan a mano (sin registro libre).
create table public.agency_invites (
  email text primary key check (email = lower(email)),
  agency_id text not null references public.agencies(id) on delete cascade,
  role text not null default 'agent' check (role in ('owner','agent')),
  created_at timestamptz not null default now()
);

-- Agencias del usuario actual (security definer para no recursar en RLS).
create function public.my_agencies() returns setof text
language sql stable security definer set search_path = ''
as $$ select agency_id from public.agency_members where user_id = (select auth.uid()) $$;

revoke all on function public.my_agencies() from public, anon;
grant execute on function public.my_agencies() to authenticated;

-- Registros de la app: client (viaje), case (caso), family (ficha), meta (datos de la agencia).
create table public.records (
  agency_id text not null references public.agencies(id) on delete cascade,
  kind text not null check (kind in ('client','case','family','meta')),
  id text not null,
  data jsonb not null default '{}'::jsonb,
  rev integer not null default 1,
  deleted boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid default auth.uid(),
  token text generated always as (case when kind = 'client' then data->>'token' end) stored,
  primary key (agency_id, kind, id)
);
create unique index records_token_key on public.records (token) where token is not null;
create index records_agency_updated on public.records (agency_id, updated_at);

-- Intentos del portal del cliente (límite de PIN). Solo la lee el servidor.
create table public.portal_attempts (
  id bigint generated always as identity primary key,
  token text not null,
  ok boolean not null,
  at timestamptz not null default now()
);
create index portal_attempts_token_at on public.portal_attempts (token, at);

alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.agency_invites enable row level security;
alter table public.records enable row level security;
alter table public.portal_attempts enable row level security;

grant select on public.agencies to authenticated;
grant select on public.agency_members to authenticated;
grant select, insert, update on public.records to authenticated;
-- agency_invites y portal_attempts: sin permisos para anon ni authenticated (solo servidor).

create policy agencies_select on public.agencies for select to authenticated
  using (id in (select public.my_agencies()));
create policy members_select on public.agency_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy records_select on public.records for select to authenticated
  using (agency_id in (select public.my_agencies()));
create policy records_insert on public.records for insert to authenticated
  with check (agency_id in (select public.my_agencies()));
create policy records_update on public.records for update to authenticated
  using (agency_id in (select public.my_agencies()))
  with check (agency_id in (select public.my_agencies()));

-- Al entrar por primera vez, el usuario reclama las invitaciones que coinciden con su mail.
create function public.claim_invites() returns setof text
language plpgsql security definer set search_path = ''
as $$
declare v_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
begin
  if (select auth.uid()) is null or v_email = '' then return; end if;
  insert into public.agency_members (user_id, agency_id, role, email)
    select (select auth.uid()), i.agency_id, i.role, v_email from public.agency_invites i where i.email = v_email
    on conflict (user_id, agency_id) do nothing;
  return query select agency_id from public.agency_members where user_id = (select auth.uid());
end $$;
revoke all on function public.claim_invites() from public, anon;
grant execute on function public.claim_invites() to authenticated;

-- Guarda registros con control de versión: si alguien cambió el registro mientras tanto, devuelve conflicto y no pisa nada.
-- p_items: [{kind,id,data,base_rev,deleted}] · base_rev = 0 para registros nuevos.
create function public.push_records(p_agency text, p_items jsonb) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare it jsonb; cur public.records; out jsonb := '[]'::jsonb; n int;
begin
  if p_agency not in (select public.my_agencies()) then raise exception 'sin acceso a la agencia' using errcode = '42501'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then raise exception 'lote inválido' using errcode = '22023'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into cur from public.records where agency_id = p_agency and kind = it->>'kind' and id = it->>'id' for update;
    if not found then
      if coalesce((it->>'base_rev')::int, 0) <> 0 then
        out := out || jsonb_build_object('kind', it->>'kind', 'id', it->>'id', 'status', 'conflict', 'gone', true);
      else
        insert into public.records (agency_id, kind, id, data, deleted) values (p_agency, it->>'kind', it->>'id', coalesce(it->'data','{}'::jsonb), coalesce((it->>'deleted')::boolean, false));
        out := out || jsonb_build_object('kind', it->>'kind', 'id', it->>'id', 'status', 'ok', 'rev', 1);
      end if;
    elsif cur.rev <> coalesce((it->>'base_rev')::int, 0) then
      out := out || jsonb_build_object('kind', cur.kind, 'id', cur.id, 'status', 'conflict', 'rev', cur.rev, 'data', cur.data, 'deleted', cur.deleted);
    else
      update public.records set data = coalesce(it->'data', data), deleted = coalesce((it->>'deleted')::boolean, deleted), rev = rev + 1, updated_at = clock_timestamp(), updated_by = (select auth.uid())
        where agency_id = p_agency and kind = cur.kind and id = cur.id returning rev into n;
      out := out || jsonb_build_object('kind', cur.kind, 'id', cur.id, 'status', 'ok', 'rev', n);
    end if;
  end loop;
  return out;
end $$;
revoke all on function public.push_records(text, jsonb) from public, anon;
grant execute on function public.push_records(text, jsonb) to authenticated;

-- Comprobantes y PDFs: bucket privado, una carpeta por agencia ({agency_id}/{file_id}).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp','image/heic'])
on conflict (id) do nothing;

create policy comprobantes_select on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and (storage.foldername(name))[1] in (select public.my_agencies()));
create policy comprobantes_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] in (select public.my_agencies()));
create policy comprobantes_update on storage.objects for update to authenticated
  using (bucket_id = 'comprobantes' and (storage.foldername(name))[1] in (select public.my_agencies()))
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] in (select public.my_agencies()));
create policy comprobantes_delete on storage.objects for delete to authenticated
  using (bucket_id = 'comprobantes' and (storage.foldername(name))[1] in (select public.my_agencies()));

-- Agencia piloto
insert into public.agencies (id, name) values ('ag_default', 'Agus Natrone Turismo');
