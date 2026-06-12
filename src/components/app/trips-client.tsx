"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { respondApplication } from "@/app/actions/applications";
import type { TurnApplication } from "@/lib/database.types";
import { Button } from "@/components/ui/button";

export type TurnLite = {
  id: string;
  origin: string;
  destination: string;
  departure_date: string | null;
  departure_time: string | null;
  university: string | null;
};

type Props = {
  userId: string;
  initialDriverApps: TurnApplication[];
  initialMyApps: TurnApplication[];
  turnsById: Record<string, TurnLite>;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-500/15 text-amber-400" },
  accepted: { label: "Aceptada", cls: "bg-brand/20 text-brand-accent" },
  rejected: { label: "Rechazada", cls: "bg-destructive/15 text-destructive" },
};

function route(turnsById: Record<string, TurnLite>, id: string) {
  const t = turnsById[id];
  return t ? `${t.origin} → ${t.destination}` : "Turno no disponible";
}

export function TripsClient({
  userId,
  initialDriverApps,
  initialMyApps,
  turnsById,
}: Props) {
  const [driverApps, setDriverApps] = useState(initialDriverApps);
  const [myApps, setMyApps] = useState(initialMyApps);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("turn_applications_feed");

    const upsert = (list: TurnApplication[], row: TurnApplication) => {
      const i = list.findIndex((a) => a.id === row.id);
      if (i === -1) return [row, ...list];
      const next = [...list];
      next[i] = row;
      return next;
    };

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "turn_applications" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setDriverApps((p) => p.filter((a) => a.id !== old.id));
          setMyApps((p) => p.filter((a) => a.id !== old.id));
          return;
        }
        const row = payload.new as TurnApplication;
        if (row.driver_id === userId) setDriverApps((p) => upsert(p, row));
        if (row.applicant_id === userId) setMyApps((p) => upsert(p, row));
      },
    );

    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function respond(id: string, accept: boolean) {
    startTransition(async () => {
      const res = await respondApplication(id, accept);
      if (res.ok) {
        toast.success(accept ? "Solicitud aceptada." : "Solicitud rechazada.");
        setDriverApps((p) =>
          p.map((a) =>
            a.id === id ? { ...a, status: accept ? "accepted" : "rejected" } : a,
          ),
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  const pendingDriver = driverApps.filter((a) => a.status === "pending");
  const decidedDriver = driverApps.filter((a) => a.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      {/* Como conductor */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Solicitudes recibidas</h2>
          <p className="text-sm text-muted-foreground">
            Pasajeros que quieren un cupo en tus turnos.
          </p>
        </div>

        {pendingDriver.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No tienes solicitudes pendientes.
          </div>
        ) : (
          <div className="grid gap-3">
            {pendingDriver.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <div className="font-semibold">{a.applicant_name ?? "Estudiante"}</div>
                  <div className="text-sm text-muted-foreground">
                    {route(turnsById, a.turn_id)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={pending} onClick={() => respond(a.id, true)}>
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => respond(a.id, false)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {decidedDriver.length > 0 && (
          <div className="grid gap-2">
            {decidedDriver.map((a) => {
              const b = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm"
                >
                  <span>
                    {a.applicant_name ?? "Estudiante"} ·{" "}
                    <span className="text-muted-foreground">{route(turnsById, a.turn_id)}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.cls}`}>
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Como pasajero */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Mis solicitudes</h2>
          <p className="text-sm text-muted-foreground">
            Estado de los cupos que pediste como pasajero.
          </p>
        </div>

        {myApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Aún no has solicitado cupo en ningún turno. Búscalos en{" "}
            <span className="text-foreground">Turnos</span>.
          </div>
        ) : (
          <div className="grid gap-2">
            {myApps.map((a) => {
              const b = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                >
                  <span className="font-medium">{route(turnsById, a.turn_id)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.cls}`}>
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
