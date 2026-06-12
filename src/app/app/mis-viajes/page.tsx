import { createClient } from "@/lib/supabase/server";
import { TripsClient, type TurnLite } from "@/components/app/trips-client";
import type { TurnApplication } from "@/lib/database.types";

const TURN_COLS = "id,origin,destination,departure_date,departure_time,university";

export default async function MisViajesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: driverApps }, { data: myApps }, { data: myTurns }] =
    await Promise.all([
      supabase
        .from("turn_applications")
        .select("*")
        .eq("driver_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("turn_applications")
        .select("*")
        .eq("applicant_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase.from("university_turns").select(TURN_COLS).eq("driver_id", user!.id),
    ]);

  // Turnos a los que postulé (para mostrar origen/destino).
  const appliedTurnIds = [...new Set((myApps ?? []).map((a) => a.turn_id))];
  const { data: appliedTurns } = appliedTurnIds.length
    ? await supabase.from("university_turns").select(TURN_COLS).in("id", appliedTurnIds)
    : { data: [] };

  const turnsById: Record<string, TurnLite> = {};
  for (const t of [...(myTurns ?? []), ...(appliedTurns ?? [])]) {
    turnsById[t.id] = t as TurnLite;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Mis viajes
        </p>
        <h1 className="mt-1 text-2xl font-bold">Gestiona tus cupos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acepta o rechaza solicitudes en tus turnos y sigue el estado de los
          cupos que pediste. Se actualiza en tiempo real.
        </p>
      </div>

      <TripsClient
        userId={user!.id}
        initialDriverApps={(driverApps ?? []) as TurnApplication[]}
        initialMyApps={(myApps ?? []) as TurnApplication[]}
        turnsById={turnsById}
      />
    </div>
  );
}
