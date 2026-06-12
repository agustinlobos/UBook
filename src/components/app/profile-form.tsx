"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  updateProfile,
  updateAvatarUrl,
  changePassword,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  userId: string;
  email: string;
  fullName: string;
  university: string;
  commune: string;
  avatarUrl: string | null;
};

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function ProfileForm({
  userId,
  email,
  fullName,
  university,
  commune,
  avatarUrl,
}: Props) {
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, startProfile] = useTransition();
  const [savingPass, startPass] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Campos controlados (evita el warning de Base UI al revalidar tras guardar).
  const [name, setName] = useState(fullName);
  const [uni, setUni] = useState(university);
  const [comuna, setComuna] = useState(commune);

  const initials = (name || email).slice(0, 2).toUpperCase();

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!EXT[file.type]) {
      toast.error("Formato no soportado. Usa PNG, JPG o WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera los 5 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${userId}/avatar-${Date.now()}.${EXT[file.type]}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setUploading(false);
      toast.error("No pudimos subir la imagen.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    const result = await updateAvatarUrl(publicUrl);
    setUploading(false);

    if (result.ok) {
      setAvatar(publicUrl);
      toast.success("Foto actualizada.");
    } else {
      toast.error(result.error);
    }
  }

  function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startProfile(async () => {
      const result = await updateProfile(fd);
      result.ok
        ? toast.success("Perfil guardado.")
        : toast.error(result.error);
    });
  }

  function onChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startPass(async () => {
      const result = await changePassword(fd);
      if (result.ok) {
        toast.success("Contraseña actualizada.");
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Foto */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Foto de perfil</h2>
        <div className="mt-4 flex items-center gap-5">
          <Avatar className="size-20">
            {avatar && <AvatarImage src={avatar} alt="Foto de perfil" />}
            <AvatarFallback className="bg-brand/20 text-brand-accent text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              variant="secondary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Subiendo…" : "Subir foto"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              PNG, JPG o WEBP. Máx 5 MB.
            </p>
          </div>
        </div>
      </section>

      {/* Datos */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Tus datos</h2>
        <form onSubmit={onSaveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="university">Universidad</Label>
            <Input id="university" name="university" value={uni} onChange={(e) => setUni(e.target.value)} maxLength={120} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="commune">Comuna</Label>
            <Input id="commune" name="commune" value={comuna} onChange={(e) => setComuna(e.target.value)} maxLength={120} required />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="email">Correo (no editable)</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Guardando…" : "Guardar perfil"}
            </Button>
          </div>
        </form>
      </section>

      {/* Contraseña */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
        <form onSubmit={onChangePassword} className="mt-4 grid max-w-sm gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <Button type="submit" variant="secondary" disabled={savingPass}>
              {savingPass ? "Actualizando…" : "Actualizar contraseña"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
