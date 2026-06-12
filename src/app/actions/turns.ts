"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UniversityTurn } from "@/lib/database.types";

export type TurnResult =
  | { ok: true; turn: UniversityTurn }
  | { ok: false; error: string };

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function createTurn(formData: FormData): Promise<TurnResult> {
  const origin = clean(formData.get("origin"));
  const destination = clean(formData.get("destination"));
  const university = clean(formData.get("university"));
  const departure_date = clean(formData.get("departure_date"));
  const departure_time = clean(formData.get("departure_time"));
  const seats_available = Number(formData.get("seats_available"));
  const contribution_clp = Number(formData.get("contribution_clp"));
  const vehicle_plate = clean(formData.get("vehicle_plate"))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (origin.length < 2 || origin.length > 120)
    return { ok: false, error: "Ingresa un origen válido." };
  if (destination.length < 2 || destination.length > 120)
    return { ok: false, error: "Ingresa un destino válido." };
  if (university.length < 2 || university.length > 120)
    return { ok: false, error: "Ingresa la universidad de destino." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departure_date))
    return { ok: false, error: "Selecciona una fecha válida." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(departure_time))
    return { ok: false, error: "Ingresa una hora válida (HH:MM)." };
  if (!Number.isInteger(seats_available) || seats_available < 1 || seats_available > 8)
    return { ok: false, error: "Los cupos deben ser entre 1 y 8." };
  if (!Number.isFinite(contribution_clp) || contribution_clp < 0 || contribution_clp > 100000)
    return { ok: false, error: "El aporte debe estar entre 0 y 100.000 CLP." };
  if (vehicle_plate.length < 4 || vehicle_plate.length > 10)
    return { ok: false, error: "La patente debe tener entre 4 y 10 caracteres (letras y números)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a iniciar sesión." };

  // driver_name y driver_rating los rellena el trigger hydrate_university_turn_driver.
  const { data, error } = await supabase
    .from("university_turns")
    .insert({
      driver_id: user.id,
      origin,
      destination,
      university,
      departure_date,
      departure_time,
      seats_available,
      contribution_clp,
      vehicle_plate,
      status: "active",
      visibility: "public",
      group_id: null,
    })
    .select("*")
    .single();

  if (error || !data)
    return { ok: false, error: "No pudimos publicar el turno. Revisa los datos." };

  revalidatePath("/app/turnos");
  return { ok: true, turn: data as UniversityTurn };
}

export async function cancelTurn(turnId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  // Transición de estado vía RPC SECURITY DEFINER (la RLS bloquea el UPDATE directo
  // porque la fila cancelada deja de cumplir la policy de SELECT de turnos activos).
  const { error } = await supabase.rpc("cancel_driver_turn", { turn_id: turnId });
  if (error) return { ok: false, error: "No pudimos cancelar el turno." };
  revalidatePath("/app/turnos");
  return { ok: true };
}
