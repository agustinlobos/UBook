import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let client: SupabaseClient<Database> | undefined;

/**
 * Cliente de Supabase para componentes de cliente ("use client").
 * Singleton: una sola instancia (y una sola conexión Realtime) por pestaña.
 * Crear múltiples clientes abre WebSockets que se pisan y vuelven el
 * Realtime poco confiable (entrega un evento y deja de entregar).
 */
export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return client;
}
