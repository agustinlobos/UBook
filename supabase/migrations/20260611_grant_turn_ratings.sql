-- Faltaban los GRANT de INSERT/UPDATE sobre turn_ratings para authenticated.
-- submit_turn_rating (SECURITY INVOKER) hace el upsert; sus policies ya restringen
-- a que el rater puntúe viajes de su propio historial. El trigger
-- turn_ratings_refresh_driver_rating recalcula el rating del perfil del conductor.

grant insert, update on public.turn_ratings to authenticated;

grant execute on function public.submit_turn_rating(uuid, integer) to authenticated;
