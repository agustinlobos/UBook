"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitWaitlist } from "@/app/actions/waitlist";

export function WaitlistDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitWaitlist(formData);
      if (result.ok) {
        toast.success("¡Listo! Ya estás en la lista de espera de umoov.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-accent">
            Registro umoov
          </p>
          <DialogTitle className="text-2xl">
            Crea tu acceso universitario
          </DialogTitle>
          <DialogDescription>
            Regístrate con tu correo universitario para entrar a la lista de
            acceso temprano. Te avisamos cuando se active tu zona.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="wl-name">Nombre</Label>
            <Input id="wl-name" name="name" placeholder="Ej: Agustín Lobos" required maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-university">Universidad</Label>
            <Input id="wl-university" name="university" placeholder="Ej: UDD" required maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-commune">Comuna</Label>
            <Input id="wl-commune" name="commune" placeholder="Ej: Chicureo" required maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-email">Correo universitario</Label>
            <Input
              id="wl-email"
              name="email"
              type="email"
              placeholder="nombre@universidad.cl"
              required
              maxLength={160}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando…" : "Crear registro"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
