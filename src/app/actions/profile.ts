"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileResult = { ok: true } | { ok: false; error: string };

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function updateProfile(formData: FormData): Promise<ProfileResult> {
  const full_name = clean(formData.get("full_name"));
  const university = clean(formData.get("university"));
  const commune = clean(formData.get("commune"));

  if (full_name.length < 2)
    return { ok: false, error: "Ingresa tu nombre." };
  if (university.length < 2)
    return { ok: false, error: "Ingresa tu universidad." };
  if (commune.length < 2)
    return { ok: false, error: "Ingresa tu comuna." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, university, commune })
    .eq("id", user.id);

  if (error) return { ok: false, error: "No pudimos guardar tu perfil." };

  revalidatePath("/app");
  revalidatePath("/app/perfil");
  return { ok: true };
}

export async function updateAvatarUrl(avatarUrl: string): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { ok: false, error: "No pudimos guardar la foto." };

  revalidatePath("/app");
  revalidatePath("/app/perfil");
  return { ok: true };
}

export async function changePassword(formData: FormData): Promise<ProfileResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8)
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: "No pudimos actualizar la contraseña." };

  return { ok: true };
}
