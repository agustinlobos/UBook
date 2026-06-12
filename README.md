# umoov

Plataforma web privada de movilidad universitaria. Conecta estudiantes verificados para coordinar **turnos** (carpooling recurrente) hacia/desde la universidad de forma segura, económica y ordenada. Comunidad cerrada — solo correo institucional verificado. _De jóvenes para jóvenes._

> Reconstrucción del proyecto previo "UBook" sobre una base técnica sólida.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (preset Nova / Base UI)
- **Supabase** — Auth, Postgres, Realtime, Storage
- **Vercel** — deploy
- Tiempo real sin reload (Supabase Realtime)

## Desarrollo

```bash
npm run dev      # servidor de desarrollo (http://localhost:3000)
npm run build    # build de producción + typecheck
npm run lint
```

## Variables de entorno (`.env`)

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente (segura) |
| `SUPABASE_SECRET_KEY` | **Solo servidor** — nunca exponer al cliente |
| `SUPABASE_DATABASE_PASSWORD` | Solo administración |

## Estructura

```
src/
  app/                  Rutas (App Router). / = landing pública.
  components/
    ui/                 Componentes shadcn/ui
    brand.tsx           Logotipo umoov
  lib/
    supabase/           Clientes browser + server + helper de sesión (proxy)
    database.types.ts   Tipos del esquema de Supabase
    constants.ts        Allowlist de dominios universitarios, sectores
  proxy.ts              Refresco de sesión + guards de ruta (Next 16 proxy)
```

## Roadmap (épicas)

0. ✅ Fundación técnica
1. Landing pública + lista de espera
2. Auth + verificación universitaria (allowlist de dominios)
3. Perfil y reputación base
4. Publicar turnos
5. Búsqueda y filtros
6. Solicitud y gestión de cupos
7. Mensajería en tiempo real
8. Calificación y reputación
9. Seguridad, reportes y moderación
10. Mapa interactivo _(diferido)_
11. Historial y métricas personales
12. Panel administrativo
13. ULife _(posterior)_
14. Migración móvil

## Modelo de datos (Supabase, ya existente)

`profiles`, `university_turns`, `turn_applications`, `turn_history`, `turn_ratings`,
`user_groups`, `group_members`, `reports`, `waitlist_signups`.
RPCs: `cancel_driver_turn`, `create_user_group`, `respond_turn_application`, `submit_turn_rating`.
