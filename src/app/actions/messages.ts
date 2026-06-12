"use server";

import { createClient } from "@/lib/supabase/server";
import type { TurnMessage } from "@/lib/database.types";

export type SendResult =
  | { ok: true; message: TurnMessage }
  | { ok: false; error: string };

export async function sendMessage(
  turnId: string,
  recipientId: string,
  rawBody: string,
): Promise<SendResult> {
  const body = rawBody.trim();
  if (body.length < 1) return { ok: false, error: "Escribe un mensaje." };
  if (body.length > 1000)
    return { ok: false, error: "El mensaje es demasiado largo (máx 1000)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const { data, error } = await supabase
    .from("turn_messages")
    .insert({ turn_id: turnId, sender_id: user.id, recipient_id: recipientId, body })
    .select("*")
    .single();

  if (error || !data)
    return { ok: false, error: "No pudimos enviar el mensaje." };

  return { ok: true, message: data as TurnMessage };
}
