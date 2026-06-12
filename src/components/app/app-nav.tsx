"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app", label: "Inicio", ready: true },
  { href: "/app/perfil", label: "Perfil", ready: true },
  { href: "/app/turnos", label: "Turnos", ready: true },
  { href: "/app/mis-viajes", label: "Mis Viajes", ready: true },
  { href: "/app/mensajes", label: "Mensajes", ready: true },
  { href: "/app/calificacion", label: "Calificación", ready: true },
  { href: "/app/denuncias", label: "Denuncias", ready: true },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        if (!item.ready) {
          return (
            <span
              key={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
            >
              {item.label}
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase">
                pronto
              </span>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
