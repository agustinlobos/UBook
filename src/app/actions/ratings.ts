"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RatingResult = { ok: true } | { ok: false; error: string };

export async function submitRating(
  historyId: string,
  score: number,
): Promise<RatingResult> {
  if (!Number.isInteger(score) || score < 1 || score > 5)
    return { ok: false, error: "La puntuación debe estar entre 1 y 5." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_turn_rating", {
    target_history_id: historyId,
    score,
  });

  if (error) {
    if (error.message?.includes("propio turno"))
      return { ok: false, error: "No puedes puntuar tu propio turno." };
    if (error.message?.includes("historial"))
      return { ok: false, error: "Solo puedes puntuar viajes de tu historial." };
    return { ok: false, error: "No pudimos guardar la puntuación." };
  }

  revalidatePath("/app/calificacion");
  revalidatePath("/app");
  return { ok: true };
}
