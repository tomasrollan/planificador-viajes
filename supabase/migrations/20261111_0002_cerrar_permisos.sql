revoke all on public.agencies, public.agency_members, public.agency_invites, public.records, public.portal_attempts from anon, authenticated;
grant select on public.agencies to authenticated;
grant select on public.agency_members to authenticated;
grant select, insert, update on public.records to authenticated;
-- Que las tablas futuras no se abran solas a anon/authenticated
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
