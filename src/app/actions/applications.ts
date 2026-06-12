"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ApplyResult = { ok: true } | { ok: false; error: string };

/** Postular a un turno (el trigger valida cupos/visibilidad e hidrata los datos). */
export async function applyToTurn(turnId: string): Promise<ApplyResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("turn_applications")
    .insert({ turn_id: turnId });

  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Ya solicitaste cupo en este turno." };
    if (error.message?.includes("No puedes postular"))
      return { ok: false, error: "Este turno ya no está disponible." };
    return { ok: false, error: "No pudimos enviar tu solicitud." };
  }

  revalidatePath("/app/turnos");
  revalidatePath("/app/mis-viajes");
  return { ok: true };
}

/** Conductor responde una solicitud (acepta o rechaza) vía RPC. */
export async function respondApplication(
  applicationId: string,
  accept: boolean,
): Promise<ApplyResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_turn_application", {
    application_id: applicationId,
    response_status: accept ? "accepted" : "rejected",
  });

  if (error) {
    if (error.message?.includes("cupos"))
      return { ok: false, error: "El turno ya no tiene cupos disponibles." };
    if (error.message?.includes("ya fue respondida"))
      return { ok: false, error: "Esta solicitud ya fue respondida." };
    return { ok: false, error: "No pudimos procesar la respuesta." };
  }

  revalidatePath("/app/mis-viajes");
  revalidatePath("/app/turnos");
  return { ok: true };
}
