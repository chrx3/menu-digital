begin;

create or replace function public.replace_particle_icons_transaction(
  p_business_id uuid,
  p_icons jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_business_admin(p_business_id) then
    raise exception 'No autorizado';
  end if;

  if (
    select count(*) from public.particle_icons
    where business_id = p_business_id
  ) <> coalesce(jsonb_array_length(p_icons), 0) then
    -- El cliente no debería pasar IDs; si los pasa, el orden se respeta.
    null;
  end if;

  -- Borrar el set actual y reinsertar en una sola transacción
  delete from public.particle_icons where business_id = p_business_id;

  insert into public.particle_icons (business_id, name, label, orden, is_active)
  select p_business_id, icon.name, icon.label, icon.orden, icon.is_active
  from jsonb_to_recordset(coalesce(p_icons, '[]'::jsonb))
    as icon(name text, label text, orden integer, is_active boolean);
end;
$$;

revoke all on function public.replace_particle_icons_transaction(uuid, jsonb) from public;

grant execute on function public.replace_particle_icons_transaction(uuid, jsonb) to authenticated;

commit;
