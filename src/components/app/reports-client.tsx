"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ReportableRide = {
  id: string;
  driver_id: string;
  label: string;
};

const REASONS: { value: string; label: string }[] = [
  { value: "seguridad", label: "Seguridad" },
  { value: "conducta", label: "Conducta inapropiada" },
  { value: "turno_falso", label: "Turno falso" },
  { value: "acoso", label: "Acoso" },
  { value: "otro", label: "Otro" },
];

export function ReportsClient({ rides }: { rides: ReportableRide[] }) {
  const [rideId, setRideId] = useState("");
  const [reason, setReason] = useState("seguridad");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ride = rides.find((r) => r.id === rideId);
    if (!ride) {
      toast.error("Selecciona el viaje relacionado.");
      return;
    }
    startTransition(async () => {
      const res = await submitReport(ride.id, ride.driver_id, reason, details);
      if (res.ok) {
        toast.success("Denuncia enviada de forma confidencial. Gracias por avisar.");
        setRideId("");
        setReason("seguridad");
        setDetails("");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (rides.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Solo puedes denunciar a partir de un viaje realizado. Cuando tengas viajes
        en tu historial, podrás reportar desde aquí.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-1.5">
        <Label>Viaje relacionado</Label>
        <Select value={rideId} onValueChange={(v) => setRideId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un viaje de tu historial" />
          </SelectTrigger>
          <SelectContent>
            {rides.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Motivo</Label>
        <Select value={reason} onValueChange={(v) => setReason(v ?? "seguridad")}>
          <SelectTrigger>
            <SelectValue>
              {(v) => REASONS.find((r) => r.value === v)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="details">Detalle</Label>
        <Textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe qué ocurrió con la mayor claridad posible (mínimo 10 caracteres)."
          maxLength={1500}
          rows={5}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar denuncia"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Tu denuncia es confidencial: no se publica ni se comparte con el usuario
        reportado. Solo el equipo de moderación puede revisarla.
      </p>
    </form>
  );
}
