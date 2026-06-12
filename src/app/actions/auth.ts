"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isUniversityEmail } from "@/lib/constants";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string };

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const fullName = clean(formData.get("full_name")).replace(/\s+/g, " ");
  const university = clean(formData.get("university")).replace(/\s+/g, " ");
  const commune = clean(formData.get("commune")).replace(/\s+/g, " ");

  if (!isUniversityEmail(email))
    return {
      ok: false,
      error: "Usa un correo universitario chileno válido. No se aceptan correos personales.",
    };
  if (password.length < 8)
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  if (fullName.length < 2)
    return { ok: false, error: "Ingresa tu nombre." };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, university, commune },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (error.code === "over_email_send_rate_limit" || error.status === 429)
      return {
        ok: false,
        error: "Demasiados registros recientes (límite de correos de Supabase). Espera unos minutos e inténtalo de nuevo.",
      };
    if (msg.includes("already") || msg.includes("registered"))
      return { ok: false, error: "Este correo ya tiene una cuenta. Inicia sesión." };
    if (msg.includes("password"))
      return { ok: false, error: "La contraseña no cumple los requisitos (mínimo 8 caracteres)." };
    return { ok: false, error: `No pudimos crear tu cuenta: ${error.message}` };
  }

  // Si no hay sesión activa, Supabase requiere confirmar el correo.
  const needsConfirmation = !data.session;
  return { ok: true, needsConfirmation };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  if (!email || !password)
    return { ok: false, error: "Ingresa tu correo y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed"))
      return { ok: false, error: "Confirma tu correo universitario antes de entrar." };
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
