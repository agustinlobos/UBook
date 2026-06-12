-- RPC para cancelar un turno (transición de estado).
-- Necesario porque la RLS solo permite turnos con status='active' visibles;
-- un UPDATE directo a status='cancelled' viola la policy de SELECT.
-- Mismo patrón que respond_turn_application / submit_turn_rating (SECURITY DEFINER).
-- Verifica que quien llama sea el conductor dueño del turno.

create or replace function public.cancel_driver_turn(turn_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_driver uuid;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select driver_id into v_driver
  from public.university_turns
  where id = turn_id;

  if v_driver is null then
    raise exception 'Turno no encontrado';
  end if;

  if v_driver <> v_uid then
    raise exception 'No puedes cancelar un turno que no es tuyo';
  end if;

  update public.university_turns
  set status = 'cancelled'
  where id = turn_id;
end;
$function$;

revoke all on function public.cancel_driver_turn(uuid) from public;
grant execute on function public.cancel_driver_turn(uuid) to authenticated;
