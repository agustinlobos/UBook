-- Falta el GRANT de INSERT sobre reports para authenticated.
-- Las denuncias son CONFIDENCIALES: solo existe policy de INSERT (denunciar desde
-- el propio historial); NO hay policy de SELECT, así que ni el denunciante puede
-- releerlas — solo el sistema/admin vía service role. Esto es intencional.

grant insert on public.reports to authenticated;
