"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const LINKS = [
  ["#problema", "Problema"],
  ["#solucion", "Solución"],
  ["#como-funciona", "Cómo funciona"],
  ["#seguridad", "Seguridad"],
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-[76px] z-40 bg-background/60"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-[76px] z-50 border-b border-border bg-background/95 backdrop-blur-xl">
            <div className="mx-auto flex w-[88%] max-w-[1200px] flex-col gap-1 py-4">
              {LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  {label}
                </a>
              ))}
              <Button
                className="mt-2 w-full"
                nativeButton={false}
                render={<Link href="/auth" />}
                onClick={() => setOpen(false)}
              >
                Entrar
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
