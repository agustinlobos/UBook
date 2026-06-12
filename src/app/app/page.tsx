import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, university, commune, rating, rating_count, avatar_url")
    .eq("id", user!.id)
    .maybeSingle();

  const name = profile?.full_name ?? user!.user_metadata?.full_name ?? user!.email;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Panel universitario
        </p>
        <h1 className="mt-2 text-3xl font-bold">Hola, {name} 👋</h1>
        <p className="mt-2 text-muted-foreground">
          Tu cuenta universitaria está verificada. Aquí irán tus turnos,
          mensajes y reputación.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs uppercase text-muted-foreground">Universidad</dt>
            <dd className="mt-1 font-semibold">{profile?.university ?? "—"}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs uppercase text-muted-foreground">Comuna</dt>
            <dd className="mt-1 font-semibold">{profile?.commune ?? "—"}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs uppercase text-muted-foreground">Rating</dt>
            <dd className="mt-1 font-semibold">
              {(profile?.rating ?? 0).toFixed(1)} / 5
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs uppercase text-muted-foreground">Correo</dt>
            <dd className="mt-1 truncate font-semibold">{user!.email}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Completa tu perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Una foto y tus datos al día generan más confianza entre estudiantes.
        </p>
        <Button className="mt-4" render={<Link href="/app/perfil" />} nativeButton={false}>
          Editar perfil
        </Button>
      </div>
    </div>
  );
}
