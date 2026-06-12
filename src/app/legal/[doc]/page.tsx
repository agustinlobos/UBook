import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";

type Section = { h: string; p: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const DOCS: Record<string, Doc> = {
  terminos: {
    title: "Términos y condiciones",
    intro:
      "umoov es una plataforma privada que conecta estudiantes universitarios verificados para coordinar turnos de traslado. No somos una empresa de transporte: solo facilitamos la conexión entre estudiantes.",
    sections: [
      {
        h: "1. Quién puede usar umoov",
        p: [
          "Solo estudiantes universitarios chilenos con correo institucional verificado. Cada cuenta es personal e intransferible.",
        ],
      },
      {
        h: "2. Naturaleza del servicio",
        p: [
          "umoov no presta servicios de transporte ni es parte de los acuerdos entre estudiantes. Los aportes son una colaboración para compartir costos, no una tarifa de transporte remunerado.",
          "La coordinación, el cumplimiento y la conducta durante los viajes son responsabilidad de los estudiantes involucrados.",
        ],
      },
      {
        h: "3. Conducta esperada",
        p: [
          "Debes entregar información veraz, respetar los horarios acordados y tratar con respeto a la comunidad. El mal uso, fraude o conductas inseguras pueden derivar en suspensión o bloqueo.",
        ],
      },
      {
        h: "4. Reputación y reportes",
        p: [
          "Las calificaciones y denuncias buscan construir confianza. Las denuncias son confidenciales y revisadas por el equipo de moderación.",
        ],
      },
      {
        h: "5. Limitación de responsabilidad",
        p: [
          "umoov no se hace responsable de daños, pérdidas o conflictos derivados de los traslados coordinados a través de la plataforma. Úsala con criterio y prioriza tu seguridad.",
        ],
      },
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    intro:
      "Cuidamos tus datos. Esta política explica qué información recolectamos y cómo la usamos. Principio central: monetizamos comunidad y atención, nunca vendemos tus datos personales.",
    sections: [
      {
        h: "1. Datos que recolectamos",
        p: [
          "Correo universitario, nombre, universidad, comuna, foto de perfil opcional, y la información de los turnos y conversaciones que generas dentro de la plataforma.",
        ],
      },
      {
        h: "2. Cómo los usamos",
        p: [
          "Para verificar tu condición de estudiante, conectarte con rutas compatibles, mostrar tu reputación y mantener la seguridad de la comunidad.",
        ],
      },
      {
        h: "3. Qué no hacemos",
        p: [
          "No vendemos tus datos personales a terceros. No exponemos públicamente tu teléfono, ubicación exacta ni correo personal sin tu consentimiento.",
        ],
      },
      {
        h: "4. Seguridad",
        p: [
          "Las contraseñas se almacenan cifradas y nunca son visibles para administradores. El acceso a los datos está restringido por políticas a nivel de base de datos.",
        ],
      },
      {
        h: "5. Tus derechos",
        p: [
          "Puedes acceder, corregir o solicitar la eliminación de tus datos escribiéndonos. Conservamos cierta información mínima cuando es necesaria para resolver denuncias o por obligaciones legales.",
        ],
      },
    ],
  },
  normas: {
    title: "Normas comunitarias",
    intro:
      "umoov es una comunidad de jóvenes para jóvenes. Estas normas mantienen la confianza y la seguridad de todos.",
    sections: [
      {
        h: "Respeto",
        p: ["Trata a cada estudiante con respeto. No se tolera acoso, discriminación ni lenguaje ofensivo."],
      },
      {
        h: "Honestidad",
        p: ["Publica turnos reales, con datos veraces. Los turnos falsos o engañosos serán removidos."],
      },
      {
        h: "Puntualidad y comunicación",
        p: ["Cumple lo acordado y avisa con anticipación cualquier cambio mediante el chat interno."],
      },
      {
        h: "Seguridad primero",
        p: [
          "No compartas datos sensibles innecesarios. Ante cualquier situación insegura, usa el botón de denuncia: es confidencial.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  const data = DOCS[doc];
  if (!data) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-[76px] w-[88%] max-w-[800px] items-center">
          <Link href="/" aria-label="umoov inicio">
            <Brand className="text-2xl" />
          </Link>
        </div>
      </header>

      <article className="mx-auto w-[88%] max-w-[800px] py-14">
        <h1 className="text-3xl font-bold">{data.title}</h1>
        <p className="mt-4 text-muted-foreground">{data.intro}</p>

        <div className="mt-10 flex flex-col gap-8">
          {data.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <Link href="/" className="text-sm text-brand-accent hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </article>
    </main>
  );
}
