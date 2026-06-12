"use server";

import { createClient } from "@/lib/supabase/server";
import { isUniversityEmail } from "@/lib/constants";

export type WaitlistResult = { ok: true } | { ok: false; error: string };

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
  const name = clean(formData.get("name"));
  const university = clean(formData.get("university"));
  const commune = clean(formData.get("commune"));
  const email = clean(formData.get("email")).toLowerCase();

  if (name.length < 2 || name.length > 120)
    return { ok: false, error: "Ingresa un nombre válido." };
  if (university.length < 2 || university.length > 120)
    return { ok: false, error: "Ingresa una universidad válida." };
  if (commune.length < 2 || commune.length > 120)
    return { ok: false, error: "Ingresa una comuna válida." };
  if (!isUniversityEmail(email))
    return {
      ok: false,
      error: "Usa un correo universitario chileno válido. No se aceptan correos personales.",
    };

  const supabase = await createClient();
  // email_domain es una columna generada en la DB; no se envía.
  const { error } = await supabase.from("waitlist_signups").insert({
    name,
    university,
    commune,
    email,
    source: "landing",
  });

  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Este correo ya está en la lista de espera." };
    return { ok: false, error: "No pudimos guardar el registro. Inténtalo nuevamente." };
  }

  return { ok: true };
}
