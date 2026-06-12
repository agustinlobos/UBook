-- Alinea is_university_email() de la DB con la allowlist del código
-- (src/lib/constants.ts → UNIVERSITY_EMAIL_DOMAINS).
-- Agrega miuandes.cl y otros dominios que faltaban, dejando DB y código idénticos.
-- Usada por la política RLS y el CHECK constraint de waitlist_signups.

create or replace function public.is_university_email(email_value text)
returns boolean
language sql
immutable
set search_path to ''
as $function$
  with email_parts as (
    select lower(trim(email_value)) as normalized_email,
           split_part(lower(trim(email_value)), '@', 2) as domain
  )
  select
    normalized_email ~ '^[a-z0-9._%+''-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    and domain <> ''
    and domain <> all (array[
      'gmail.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'yahoo.com',
      'live.com',
      'msn.com',
      'protonmail.com'
    ])
    and exists (
      select 1
      from unnest(array[
        'udd.cl',
        'uc.cl',
        'uchile.cl',
        'usach.cl',
        'uai.cl',
        'alumnos.uai.cl',
        'udp.cl',
        'unab.cl',
        'uandes.cl',
        'miuandes.cl',
        'usm.cl',
        'pucv.cl',
        'uv.cl',
        'utem.cl',
        'umayor.cl',
        'ufrontera.cl',
        'udec.cl',
        'ucsc.cl',
        'uft.cl',
        'uss.cl',
        'ucentral.cl',
        'duocuc.cl',
        'santotomas.cl',
        'uct.cl',
        'uach.cl',
        'ubiobio.cl',
        'utalca.cl'
      ]) as university_domain(allowed_domain)
      where domain = allowed_domain
         or domain like '%.' || allowed_domain
    )
  from email_parts;
$function$;
