import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/landing/site-header";
import { WaitlistDialog } from "@/components/landing/waitlist-dialog";
import { SECTORS } from "@/lib/constants";

const PROBLEMS = [
  {
    title: "Grupos desordenados",
    body: "WhatsApp e Instagram no fueron creados para coordinar turnos de forma segura ni ordenada.",
  },
  {
    title: "Poca seguridad",
    body: "No siempre sabes con quién viajas, si está verificado o si tiene reputación real.",
  },
  {
    title: "Altos costos",
    body: "Combustible, TAG, estacionamiento y viajes diarios terminan pesando todos los meses.",
  },
];

const BENEFITS = [
  "Correos universitarios verificados",
  "Prioridad por universidad",
  "Rutas compatibles",
  "Turnos fijos y recurrentes",
  "Chat interno",
  "Reputación visible",
];

const STEPS = [
  {
    n: "1",
    title: "Verifica tu correo",
    body: "Solo pueden entrar estudiantes con correo universitario chileno.",
  },
  {
    n: "2",
    title: "Encuentra o crea un turno",
    body: "Busca estudiantes que viajen desde tu zona hacia tu universidad.",
  },
  {
    n: "3",
    title: "Coordina y viaja seguro",
    body: "Usa el chat interno, revisa perfiles, reputación y cupos disponibles.",
  },
];

const SECURITY = [
  "Acceso solo con correo universitario",
  "Perfiles verificados y reputación pública",
  "Reportes, bloqueos y control comunitario",
  "Chat interno sin exponer tu teléfono al inicio",
  "Badges de confianza y viajes realizados",
];

const FAQ = [
  {
    q: "¿Quién puede entrar a umoov?",
    a: "Solo estudiantes universitarios chilenos con correo institucional verificado. Es una comunidad cerrada.",
  },
  {
    q: "¿umoov es una empresa de transporte?",
    a: "No. umoov es una plataforma de conexión entre estudiantes que comparten rutas. No somos un servicio de transporte formal.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Al inicio es gratis. Más adelante habrá funciones premium opcionales, pensadas para un público universitario.",
  },
  {
    q: "¿Cómo cuidan mi seguridad?",
    a: "Verificación por correo, perfiles con reputación, reportes, bloqueos y moderación. La seguridad es el centro del proyecto.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* HERO */}
        <section className="mx-auto grid w-[88%] max-w-[1200px] items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-accent">
              Solo estudiantes verificados
            </span>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              La red privada de movilidad universitaria
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Conecta con estudiantes verificados, organiza turnos seguros y
              reduce tus costos de traslado hacia la universidad.
            </p>
            <div className="flex flex-wrap gap-3">
              <WaitlistDialog>
                <Button size="lg">Entrar a umoov</Button>
              </WaitlistDialog>
              <Button size="lg" variant="secondary" nativeButton={false} render={<a href="#como-funciona" />}>
                Ver cómo funciona
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {[
                ["100%", "universitario"],
                ["0%", "comisión por viaje"],
                ["24/7", "turnos y rutas"],
              ].map(([n, label]) => (
                <div key={label} className="rounded-xl border border-border bg-card px-5 py-4">
                  <div className="text-2xl font-bold text-brand-accent">{n}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* App preview */}
          <div className="relative">
            <div className="mx-auto w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <Brand className="text-xl" />
                <span className="rounded-full bg-brand/20 px-2.5 py-1 text-xs font-medium text-brand-accent">
                  Verificado
                </span>
              </div>
              <div className="relative mb-4 h-40 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-dark/40 to-background">
                <div className="absolute left-6 top-6 h-3 w-3 rounded-full bg-brand-accent ring-4 ring-brand-accent/20" />
                <div className="absolute bottom-6 right-6 h-3 w-3 rounded-full bg-foreground ring-4 ring-foreground/10" />
                <div className="absolute left-7 top-7 h-[calc(100%-3.5rem)] w-[calc(100%-3.5rem)] border-b border-l border-dashed border-brand-accent/40" />
                <div className="absolute left-4 top-3 text-xs text-muted-foreground">
                  <div className="text-[10px] uppercase">Origen</div>
                  <div className="font-semibold text-foreground">Chicureo</div>
                </div>
                <div className="absolute bottom-3 right-4 text-right text-xs text-muted-foreground">
                  <div className="text-[10px] uppercase">Destino</div>
                  <div className="font-semibold text-foreground">UDD</div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Turno disponible</div>
                    <div className="text-base font-semibold">Chicureo → UDD</div>
                  </div>
                  <span className="text-sm text-brand-accent">3 cupos</span>
                </div>
                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Hora", "07:15"],
                    ["Rating", "4.9"],
                    ["Aporte", "$3.000"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-card py-2">
                      <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                      <div className="text-sm font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
                <Button className="w-full" disabled>
                  Solicitar turno
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEMA */}
        <section id="problema" className="border-t border-border">
          <div className="mx-auto w-[88%] max-w-[1200px] py-20">
            <Eyebrow>El problema</Eyebrow>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
              Moverse a la universidad no debería ser tan difícil
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PROBLEMS.map((p) => (
                <article key={p.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUCIÓN */}
        <section id="solucion" className="border-t border-border bg-card/40">
          <div className="mx-auto grid w-[88%] max-w-[1200px] gap-10 py-20 lg:grid-cols-2">
            <div>
              <Eyebrow>La solución</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                umoov organiza la movilidad universitaria
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Encuentra turnos compatibles, coordina con estudiantes
                verificados y prioriza personas de tu misma universidad o rutas
                cercanas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((b) => (
                <div key={b} className="rounded-xl border border-border bg-background p-4 text-sm font-medium">
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="border-t border-border">
          <div className="mx-auto w-[88%] max-w-[1200px] py-20 text-center">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Tres pasos simples</h2>
            <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
              {STEPS.map((s) => (
                <article key={s.n} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground font-bold">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SEGURIDAD */}
        <section id="seguridad" className="border-t border-border bg-card/40">
          <div className="mx-auto grid w-[88%] max-w-[1200px] gap-10 py-20 lg:grid-cols-2">
            <div>
              <Eyebrow>Seguridad</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Diseñada para una comunidad universitaria segura
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                La confianza no es una función más. Es el centro de umoov.
              </p>
            </div>
            <ul className="grid gap-3">
              {SECURITY.map((s) => (
                <li key={s} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                  <span className="mt-0.5 text-brand-accent">✓</span>
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ZONAS */}
        <section className="border-t border-border">
          <div className="mx-auto w-[88%] max-w-[1200px] py-20">
            <Eyebrow>Zonas iniciales</Eyebrow>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
              Pensada para lugares con alta fricción de movilidad
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Partimos conectando comunidades donde el transporte público no
              siempre es suficiente y los traslados diarios son largos o caros.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {SECTORS.slice(0, 12).map((z) => (
                <span key={z} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
                  {z}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto w-[88%] max-w-[1200px] py-20">
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Resolvemos tus dudas</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {FAQ.map((f) => (
                <article key={f.q} className="rounded-2xl border border-border bg-background p-6">
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="border-t border-border">
          <div className="mx-auto w-[88%] max-w-[1200px] py-24 text-center">
            <h2 className="mx-auto max-w-2xl text-balance text-4xl font-extrabold tracking-tight">
              Únete a la comunidad de movilidad universitaria
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              De jóvenes para jóvenes. Regístrate con tu correo universitario y
              te avisamos cuando se active tu zona.
            </p>
            <div className="mt-8 flex justify-center">
              <WaitlistDialog>
                <Button size="lg">Quiero entrar</Button>
              </WaitlistDialog>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-[88%] max-w-[1200px] flex-col items-start gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Brand className="text-xl" />
            <p className="text-sm text-muted-foreground">
              Movilidad universitaria privada, segura y conectada.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <a className="transition-colors hover:text-foreground" href="/legal/terminos">Términos</a>
            <a className="transition-colors hover:text-foreground" href="/legal/privacidad">Privacidad</a>
            <a className="transition-colors hover:text-foreground" href="/legal/normas">Normas comunitarias</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
