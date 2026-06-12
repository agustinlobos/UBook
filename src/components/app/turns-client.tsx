"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createTurn, cancelTurn } from "@/app/actions/turns";
import { applyToTurn } from "@/app/actions/applications";
import type { UniversityTurn } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SortKey = "date_asc" | "date_desc" | "value_asc" | "value_desc";

const SORT_LABELS: Record<SortKey, string> = {
  date_asc: "Fecha: más próxima",
  date_desc: "Fecha: más lejana",
  value_asc: "Aporte: menor a mayor",
  value_desc: "Aporte: mayor a menor",
};

type Props = {
  userId: string;
  defaultUniversity: string;
  initialTurns: UniversityTurn[];
  appliedTurnIds: string[];
};

function fmtDate(d: string | null) {
  if (!d) return "Sin fecha";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}
function fmtTime(t: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}
function fmtClp(n: number) {
  return new Intl.NumberFormat("es-CL").format(n);
}

export function TurnsClient({
  userId,
  defaultUniversity,
  initialTurns,
  appliedTurnIds,
}: Props) {
  const [turns, setTurns] = useState<UniversityTurn[]>(initialTurns);
  const [applied, setApplied] = useState<Set<string>>(new Set(appliedTurnIds));
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Filtros (EPIC 5) — se aplican en vivo sobre el estado que alimenta Realtime.
  const [query, setQuery] = useState("");
  const [day, setDay] = useState("");
  const [sort, setSort] = useState<SortKey>("date_asc");

  const visibleTurns = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = turns.filter((t) => {
      if (day && t.departure_date !== day) return false;
      if (q) {
        const hay = `${t.origin} ${t.destination} ${t.university ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "value_asc":
          return a.contribution_clp - b.contribution_clp;
        case "value_desc":
          return b.contribution_clp - a.contribution_clp;
        case "date_desc":
          return (b.departure_date ?? "").localeCompare(a.departure_date ?? "");
        case "date_asc":
        default:
          return (a.departure_date ?? "").localeCompare(b.departure_date ?? "");
      }
    });
    return list;
  }, [turns, query, day, sort]);

  const hasFilters = query.trim() !== "" || day !== "" || sort !== "date_asc";

  // Realtime: turnos nuevos / cambios aparecen sin recargar.
  useEffect(() => {
    const supabase = createClient();

    // Channel creado de forma síncrona y handlers ANTES de subscribe()
    // (evita el error de Strict Mode al reusar un channel ya suscrito).
    const channel = supabase.channel("university_turns_feed");

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "university_turns" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as UniversityTurn;
          if (row.status === "active" && row.visibility === "public") {
            setTurns((prev) =>
              prev.some((t) => t.id === row.id) ? prev : [row, ...prev],
            );
          }
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as UniversityTurn;
          setTurns((prev) => {
            const visible = row.status === "active" && row.visibility === "public";
            const exists = prev.some((t) => t.id === row.id);
            if (!visible) return prev.filter((t) => t.id !== row.id);
            if (!exists) return [row, ...prev];
            return prev.map((t) => (t.id === row.id ? row : t));
          });
        } else if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setTurns((prev) => prev.filter((t) => t.id !== old.id));
        }
      },
    );

    // Autentica la conexión de Realtime con el JWT del usuario para que
    // postgres_changes respete la RLS, y recién ahí subscribe.
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
      channel.subscribe();
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTurn(fd);
      if (result.ok) {
        setTurns((prev) =>
          prev.some((t) => t.id === result.turn.id) ? prev : [result.turn, ...prev],
        );
        toast.success("Turno publicado.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function onCancel(turnId: string) {
    startTransition(async () => {
      const result = await cancelTurn(turnId);
      if (result.ok) {
        setTurns((prev) => prev.filter((t) => t.id !== turnId));
        toast.success("Turno cancelado.");
      } else {
        toast.error(result.error ?? "Error al cancelar.");
      }
    });
  }

  function onApply(turnId: string) {
    startTransition(async () => {
      const result = await applyToTurn(turnId);
      if (result.ok) {
        setApplied((prev) => new Set(prev).add(turnId));
        toast.success("Solicitud enviada. El conductor te responderá.");
      } else {
        toast.error(result.error);
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Turnos activos</h2>
          <p className="text-sm text-muted-foreground">
            {visibleTurns.length} de {turns.length} turno
            {turns.length === 1 ? "" : "s"} · se actualiza en tiempo real
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Crear turno</Button>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Publicar un turno</DialogTitle>
              <DialogDescription>
                Otros estudiantes verificados podrán encontrarlo y solicitar cupo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="origin">Origen</Label>
                <Input id="origin" name="origin" placeholder="Ej: Chicureo" maxLength={120} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="destination">Destino</Label>
                <Input id="destination" name="destination" placeholder="Ej: UDD" maxLength={120} required />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="university">Universidad</Label>
                <Input id="university" name="university" defaultValue={defaultUniversity} placeholder="Ej: UANDES" maxLength={120} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="departure_date">Fecha</Label>
                <Input id="departure_date" name="departure_date" type="date" min={today} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="departure_time">Hora de salida</Label>
                <Input id="departure_time" name="departure_time" type="time" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="seats_available">Cupos</Label>
                <Input id="seats_available" name="seats_available" type="number" min={1} max={8} defaultValue={3} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contribution_clp">Aporte (CLP)</Label>
                <Input id="contribution_clp" name="contribution_clp" type="number" min={0} max={100000} step={500} defaultValue={3000} required />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="vehicle_plate">Patente</Label>
                <Input id="vehicle_plate" name="vehicle_plate" placeholder="Ej: ABCD12" maxLength={10} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Publicando…" : "Publicar turno"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros (EPIC 5) */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <Input
          placeholder="Buscar por comuna, destino o universidad…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar turnos"
        />
        <Input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          aria-label="Filtrar por día"
          className="sm:w-44"
        />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="sm:w-52" aria-label="Ordenar">
            <SelectValue>{(value) => SORT_LABELS[value as SortKey]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_asc">Fecha: más próxima</SelectItem>
            <SelectItem value="date_desc">Fecha: más lejana</SelectItem>
            <SelectItem value="value_asc">Aporte: menor a mayor</SelectItem>
            <SelectItem value="value_desc">Aporte: mayor a menor</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          disabled={!hasFilters}
          onClick={() => {
            setQuery("");
            setDay("");
            setSort("date_asc");
          }}
        >
          Limpiar
        </Button>
      </div>

      {turns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
          Todavía no hay turnos activos. ¡Publica el primero!
        </div>
      ) : visibleTurns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
          Ningún turno coincide con tu búsqueda.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTurns.map((t) => {
            const mine = t.driver_id === userId;
            return (
              <article key={t.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t.university ?? "—"}
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t.origin} → {t.destination}
                    </h3>
                  </div>
                  <span className="rounded-full bg-brand/20 px-2.5 py-1 text-xs font-medium text-brand-accent">
                    {t.seats_available} cupo{t.seats_available === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-background py-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Fecha</div>
                    <div className="text-sm font-semibold">{fmtDate(t.departure_date)}</div>
                  </div>
                  <div className="rounded-lg bg-background py-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Hora</div>
                    <div className="text-sm font-semibold">{fmtTime(t.departure_time)}</div>
                  </div>
                  <div className="rounded-lg bg-background py-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Aporte</div>
                    <div className="text-sm font-semibold">${fmtClp(t.contribution_clp)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {t.driver_name ?? "Conductor"}
                    {mine && <span className="ml-1 text-brand-accent">(tú)</span>}
                  </span>
                  <span>★ {Number(t.driver_rating ?? 0).toFixed(1)}</span>
                </div>

                {mine ? (
                  <Button variant="destructive" disabled={pending} onClick={() => onCancel(t.id)}>
                    Cancelar turno
                  </Button>
                ) : applied.has(t.id) ? (
                  <Button variant="secondary" disabled>
                    Solicitud enviada ✓
                  </Button>
                ) : !t.driver_id ? (
                  <Button variant="secondary" disabled>
                    No disponible
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={pending || t.seats_available <= 0}
                    onClick={() => onApply(t.id)}
                  >
                    {t.seats_available <= 0 ? "Sin cupos" : "Solicitar cupo"}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
