import { createClient } from "@/lib/supabase/server";
import { TurnsClient } from "@/components/app/turns-client";
import type { UniversityTurn } from "@/lib/database.types";

export default async function TurnosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: turns }, { data: myApps }] = await Promise.all([
    supabase.from("profiles").select("university").eq("id", user!.id).maybeSingle(),
    supabase
      .from("university_turns")
      .select("*")
      .eq("status", "active")
      .eq("visibility", "public")
      .order("departure_date", { ascending: true })
      .order("departure_time", { ascending: true }),
    supabase.from("turn_applications").select("turn_id").eq("applicant_id", user!.id),
  ]);

  const appliedTurnIds = (myApps ?? []).map((a) => a.turn_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Turnos universitarios
        </p>
        <h1 className="mt-1 text-2xl font-bold">Explora o publica un turno</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turnos activos de estudiantes verificados. Publica el tuyo si tienes
          auto y cupos disponibles.
        </p>
      </div>

      <TurnsClient
        userId={user!.id}
        defaultUniversity={profile?.university ?? ""}
        initialTurns={(turns ?? []) as UniversityTurn[]}
        appliedTurnIds={appliedTurnIds}
      />
    </div>
  );
}
