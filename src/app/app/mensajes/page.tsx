import { createClient } from "@/lib/supabase/server";
import { MessagesClient, type Thread } from "@/components/app/messages-client";
import type { TurnMessage } from "@/lib/database.types";

export default async function MensajesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  // Conversaciones = solicitudes aceptadas (como conductor y como pasajero).
  const [{ data: asDriver }, { data: asPassenger }, { data: messages }] =
    await Promise.all([
      supabase
        .from("turn_applications")
        .select("turn_id, applicant_id, applicant_name")
        .eq("driver_id", me)
        .eq("status", "accepted"),
      supabase
        .from("turn_applications")
        .select("turn_id, driver_id")
        .eq("applicant_id", me)
        .eq("status", "accepted"),
      supabase
        .from("turn_messages")
        .select("*")
        .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
        .order("created_at", { ascending: true }),
    ]);

  // Etiquetas de turnos (origen→destino y nombre del conductor).
  const turnIds = [
    ...new Set([
      ...(asDriver ?? []).map((a) => a.turn_id),
      ...(asPassenger ?? []).map((a) => a.turn_id),
    ]),
  ];
  const { data: turns } = turnIds.length
    ? await supabase
        .from("university_turns")
        .select("id, origin, destination, driver_name")
        .in("id", turnIds)
    : { data: [] };
  const turnsById = new Map((turns ?? []).map((t) => [t.id, t]));

  const threads: Thread[] = [];
  for (const a of asDriver ?? []) {
    const t = turnsById.get(a.turn_id);
    threads.push({
      key: `${a.turn_id}:${a.applicant_id}`,
      turnId: a.turn_id,
      otherId: a.applicant_id,
      otherName: a.applicant_name ?? "Pasajero",
      turnLabel: t ? `${t.origin} → ${t.destination}` : "Turno",
      role: "Conductor",
    });
  }
  for (const a of asPassenger ?? []) {
    const t = turnsById.get(a.turn_id);
    if (!a.driver_id) continue;
    threads.push({
      key: `${a.turn_id}:${a.driver_id}`,
      turnId: a.turn_id,
      otherId: a.driver_id,
      otherName: t?.driver_name ?? "Conductor",
      turnLabel: t ? `${t.origin} → ${t.destination}` : "Turno",
      role: "Pasajero",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Mensajes
        </p>
        <h1 className="mt-1 text-2xl font-bold">Coordina tus viajes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chatea con conductores y pasajeros de tus turnos confirmados. En tiempo
          real.
        </p>
      </div>

      <MessagesClient
        userId={me}
        threads={threads}
        initialMessages={(messages ?? []) as TurnMessage[]}
      />
    </div>
  );
}
