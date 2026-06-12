-- Faltaba el GRANT de UPDATE sobre university_turns para el rol authenticated.
-- La política RLS "Drivers can update their own turns" ya restringe a los turnos
-- propios (auth.uid = driver_id), así que el GRANT no amplía el alcance real:
-- solo habilita que la política pueda ejecutarse (sin GRANT, Postgres deniega 42501).
-- Necesario para cancelar turnos (EPIC 4) y actualizar cupos/estado (EPIC 6).

grant update on public.university_turns to authenticated;
