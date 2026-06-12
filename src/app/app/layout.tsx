import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Brand } from "@/components/brand";
import { AppNav } from "@/components/app/app-nav";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="mx-auto flex w-[92%] max-w-[1200px] flex-1 gap-6 py-6">
      {/* Sidebar */}
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-56 shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-4 md:flex">
        <div className="flex flex-col gap-6">
          <Link href="/app" aria-label="umoov">
            <Brand className="text-xl" />
          </Link>
          <AppNav />
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
            redirect("/auth");
          }}
        >
          <Button type="submit" variant="secondary" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </aside>

      {/* Contenido */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
