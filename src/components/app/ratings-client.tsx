"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitRating } from "@/app/actions/ratings";
import { cn } from "@/lib/utils";

export type RideHistory = {
  id: string;
  driver_name: string | null;
  origin: string;
  destination: string;
  ride_date: string | null;
  driver_id: string | null;
};

type Props = {
  rating: number;
  ratingCount: number;
  rides: RideHistory[];
  ratingsByHistory: Record<string, number>;
};

function Stars({
  value,
  onRate,
  size = "text-xl",
}: {
  value: number;
  onRate?: (n: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={cn("flex gap-0.5", size)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(n)}
          onMouseEnter={() => onRate && setHover(n)}
          onMouseLeave={() => onRate && setHover(0)}
          className={cn(
            n <= shown ? "text-brand-accent" : "text-muted-foreground/30",
            onRate ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default",
          )}
          aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function RatingsClient({ rating, ratingCount, rides, ratingsByHistory }: Props) {
  const [ratings, setRatings] = useState(ratingsByHistory);
  const [, startTransition] = useTransition();

  function rate(historyId: string, score: number) {
    const prev = ratings[historyId];
    setRatings((r) => ({ ...r, [historyId]: score })); // optimista
    startTransition(async () => {
      const res = await submitRating(historyId, score);
      if (res.ok) {
        toast.success("¡Gracias por tu puntuación!");
      } else {
        toast.error(res.error);
        setRatings((r) => {
          const next = { ...r };
          if (prev) next[historyId] = prev;
          else delete next[historyId];
          return next;
        });
      }
    });
  }

  const rateable = rides.filter((r) => r.driver_id);

  return (
    <div className="flex flex-col gap-8">
      {/* Mi reputación */}
      <section className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Tu calificación
        </p>
        <div className="mt-3 text-5xl font-extrabold">
          {rating.toFixed(1)}
          <span className="text-2xl text-muted-foreground"> / 5</span>
        </div>
        <div className="mt-3 flex justify-center">
          <Stars value={Math.round(rating)} size="text-2xl" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {ratingCount === 0
            ? "Aún no tienes calificaciones."
            : `Basado en ${ratingCount} calificación${ratingCount === 1 ? "" : "es"}.`}
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-background p-4 text-left">
          <h3 className="text-sm font-semibold">Consejos para subir tu puntuación</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Llega a la hora acordada y avisa con anticipación si hay cambios.</li>
            <li>• Mantén el vehículo limpio, seguro y con la patente visible.</li>
            <li>• Confirma origen, destino y aporte antes de iniciar el turno.</li>
            <li>• Conduce con calma y respeta las preferencias de los pasajeros.</li>
          </ul>
        </div>
      </section>

      {/* Calificar viajes */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Califica tus viajes</h2>
          <p className="text-sm text-muted-foreground">
            Puntúa a los conductores de los viajes que realizaste.
          </p>
        </div>

        {rateable.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Todavía no tienes viajes realizados para calificar.
          </div>
        ) : (
          <div className="grid gap-3">
            {rateable.map((ride) => (
              <div
                key={ride.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <div className="font-semibold">{ride.driver_name ?? "Conductor"}</div>
                  <div className="text-sm text-muted-foreground">
                    {ride.origin} → {ride.destination}
                    {ride.ride_date ? ` · ${ride.ride_date.split("-").reverse().join("-")}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Stars
                    value={ratings[ride.id] ?? 0}
                    onRate={(n) => rate(ride.id, n)}
                  />
                  {ratings[ride.id] && (
                    <span className="text-xs text-muted-foreground">Tu puntuación</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
