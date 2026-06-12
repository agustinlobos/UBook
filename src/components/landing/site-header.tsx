import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { WaitlistDialog } from "@/components/landing/waitlist-dialog";
import { MobileNav } from "@/components/landing/mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-[88%] max-w-[1200px] items-center justify-between">
        <Link href="/" aria-label="umoov inicio">
          <Brand className="text-2xl" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a className="transition-colors hover:text-foreground" href="#problema">Problema</a>
          <a className="transition-colors hover:text-foreground" href="#solucion">Solución</a>
          <a className="transition-colors hover:text-foreground" href="#como-funciona">Cómo funciona</a>
          <a className="transition-colors hover:text-foreground" href="#seguridad">Seguridad</a>
        </nav>
        <div className="flex items-center gap-2">
          <WaitlistDialog>
            <Button variant="secondary" className="hidden sm:inline-flex">
              Lista de espera
            </Button>
          </WaitlistDialog>
          <Button
            className="hidden md:inline-flex"
            nativeButton={false}
            render={<Link href="/auth" />}
          >
            Entrar
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
