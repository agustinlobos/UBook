import { createClient } from "@/lib/supabase/server";
import { ReportsClient, type ReportableRide } from "@/components/app/reports-client";

export default async function DenunciasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: history } = await supabase
    .from("turn_history")
    .select("id, driver_id, driver_name, origin, destination, ride_date")
    .eq("user_id", user!.id)
    .order("ride_date", { ascending: false });

  const rides: ReportableRide[] = (history ?? [])
    .filter((h) => h.driver_id)
    .map((h) => ({
      id: h.id,
      driver_id: h.driver_id as string,
      label: `${h.origin} → ${h.destination} · ${h.driver_name ?? "Conductor"}${
        h.ride_date ? ` · ${h.ride_date.split("-").reverse().join("-")}` : ""
      }`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Denuncias
        </p>
        <h1 className="mt-1 text-2xl font-bold">Reporta un problema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reporta a un conductor desde un viaje de tu historial. Tu denuncia es
          confidencial y no se publica.
        </p>
      </div>

      <ReportsClient rides={rides} />
    </div>
  );
}
