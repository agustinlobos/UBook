import { createClient } from "@/lib/supabase/server";
import { RatingsClient, type RideHistory } from "@/components/app/ratings-client";

export default async function CalificacionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const [{ data: profile }, { data: history }, { data: myRatings }] =
    await Promise.all([
      supabase.from("profiles").select("rating, rating_count").eq("id", me).maybeSingle(),
      supabase
        .from("turn_history")
        .select("id, driver_name, origin, destination, ride_date, driver_id")
        .eq("user_id", me)
        .eq("status", "completed")
        .order("ride_date", { ascending: false }),
      supabase.from("turn_ratings").select("history_id, rating").eq("rater_id", me),
    ]);

  const ratingsByHistory: Record<string, number> = {};
  for (const r of myRatings ?? []) {
    if (r.history_id) ratingsByHistory[r.history_id] = r.rating;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Calificación
        </p>
        <h1 className="mt-1 text-2xl font-bold">Tu reputación en la comunidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu puntuación como conductor y la calificación de los viajes que hiciste.
        </p>
      </div>

      <RatingsClient
        rating={Number(profile?.rating ?? 0)}
        ratingCount={profile?.rating_count ?? 0}
        rides={(history ?? []) as RideHistory[]}
        ratingsByHistory={ratingsByHistory}
      />
    </div>
  );
}
