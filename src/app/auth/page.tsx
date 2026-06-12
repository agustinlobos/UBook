import { Suspense } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <Link href="/" aria-label="umoov inicio" className="mb-8">
        <Brand className="text-3xl" />
      </Link>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Entra con tu correo universitario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea tu cuenta o inicia sesión para ver turnos y coordinar tus viajes.
        </p>
      </div>
      <Suspense>
        <AuthForm />
      </Suspense>
    </main>
  );
}
