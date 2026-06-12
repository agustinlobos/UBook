import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/app/profile-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, university, commune, avatar_url")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Mi perfil
        </p>
        <h1 className="mt-1 text-2xl font-bold">Edita tu información</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estos datos se usan en tus turnos y aumentan la confianza de la comunidad.
        </p>
      </div>

      <ProfileForm
        userId={user!.id}
        email={user!.email ?? ""}
        fullName={profile?.full_name ?? user!.user_metadata?.full_name ?? ""}
        university={profile?.university ?? user!.user_metadata?.university ?? ""}
        commune={profile?.commune ?? user!.user_metadata?.commune ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}
