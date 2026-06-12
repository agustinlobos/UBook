"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportResult = { ok: true } | { ok: false; error: string };

const REASONS = ["seguridad", "conducta", "turno_falso", "acoso", "otro"];

export async function submitReport(
  historyId: string,
  reportedUserId: string,
  reason: string,
  rawDetails: string,
): Promise<ReportResult> {
  const details = rawDetails.trim();
  if (!REASONS.includes(reason))
    return { ok: false, error: "Selecciona un motivo válido." };
  if (details.length < 10 || details.length > 1500)
    return { ok: false, error: "El detalle debe tener entre 10 y 1500 caracteres." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    history_id: historyId,
    reported_user_id: reportedUserId,
    reason,
    details,
  });

  if (error)
    return { ok: false, error: "No pudimos enviar la denuncia. Revisa los datos." };

  return { ok: true };
}
