"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/app/actions/auth";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (mode === "login") {
        const result = await signIn(formData);
        if (result.ok) {
          const redirect = searchParams.get("redirect") || "/app";
          router.replace(redirect);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await signUp(formData);
        if (!result.ok) {
          toast.error(result.error);
        } else if (result.needsConfirmation) {
          toast.success(
            "Cuenta creada. Revisa tu correo universitario para confirmar tu acceso.",
          );
          setMode("login");
        } else {
          router.replace("/app");
          router.refresh();
        }
      }
    });
  }

  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
            !isSignup ? "bg-brand text-brand-foreground" : "text-muted-foreground"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
            isSignup ? "bg-brand text-brand-foreground" : "text-muted-foreground"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        {isSignup && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" name="full_name" placeholder="Ej: Agustín Lobos" maxLength={120} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="university">Universidad</Label>
                <Input id="university" name="university" placeholder="UDD" maxLength={120} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="commune">Comuna</Label>
                <Input id="commune" name="commune" placeholder="Chicureo" maxLength={120} />
              </div>
            </div>
          </>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="email">Correo universitario</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nombre@universidad.cl"
            autoCapitalize="none"
            autoComplete="username"
            spellCheck={false}
            maxLength={160}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={isSignup ? "Mínimo 8 caracteres" : "Tu contraseña"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? "Procesando…"
            : isSignup
              ? "Crear cuenta"
              : "Iniciar sesión"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Solo estudiantes con correo universitario chileno verificado.
      </p>
    </div>
  );
}
