-- Faltaban los GRANT de INSERT/UPDATE sobre turn_applications para authenticated.
-- Las políticas RLS ya restringen el alcance:
--   * INSERT: el trigger prepare_turn_application_insert fija applicant_id = auth.uid()
--     y valida cupos/visibilidad; la policy exige applicant_id = auth.uid().
--   * UPDATE: solo el conductor (auth.uid = driver_id); el RPC respond_turn_application
--     (SECURITY INVOKER) hace el UPDATE, y su trigger SECURITY DEFINER descuenta cupos
--     e inserta el historial.

grant insert, update on public.turn_applications to authenticated;

grant execute on function public.respond_turn_application(uuid, text) to authenticated;
