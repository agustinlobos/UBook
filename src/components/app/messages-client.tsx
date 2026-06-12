"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/messages";
import type { TurnMessage } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Thread = {
  key: string;
  turnId: string;
  otherId: string;
  otherName: string;
  turnLabel: string;
  role: "Conductor" | "Pasajero";
};

type Props = {
  userId: string;
  threads: Thread[];
  initialMessages: TurnMessage[];
};

export function MessagesClient({ userId, threads, initialMessages }: Props) {
  const [messages, setMessages] = useState<TurnMessage[]>(initialMessages);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    threads[0]?.key ?? null,
  );
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const threadKeyOf = (m: TurnMessage) =>
    `${m.turn_id}:${m.sender_id === userId ? m.recipient_id : m.sender_id}`;

  const selectedThread = threads.find((t) => t.key === selectedKey) ?? null;

  const threadMessages = useMemo(
    () =>
      selectedKey
        ? messages.filter((m) => threadKeyOf(m) === selectedKey)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, selectedKey],
  );

  // Realtime: mensajes entrantes/salientes sin recargar.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("turn_messages_feed");

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "turn_messages" },
      (payload) => {
        const row = payload.new as TurnMessage;
        setMessages((prev) =>
          prev.some((m) => m.id === row.id) ? prev : [...prev, row],
        );
      },
    );

    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      channel.subscribe();
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll al final.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [threadMessages.length, selectedKey]);

  function onSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedThread || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    startTransition(async () => {
      const res = await sendMessage(selectedThread.turnId, selectedThread.otherId, body);
      if (res.ok) {
        setMessages((prev) =>
          prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message],
        );
      } else {
        toast.error(res.error);
        setDraft(body);
      }
    });
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
        Aún no tienes conversaciones. Se habilitan cuando un conductor acepta tu
        cupo (o tú aceptas a un pasajero).
      </div>
    );
  }

  return (
    <div className="grid h-[600px] grid-cols-[260px_1fr] overflow-hidden rounded-2xl border border-border bg-card">
      {/* Lista de conversaciones */}
      <aside className="overflow-y-auto border-r border-border">
        {threads.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSelectedKey(t.key)}
            className={cn(
              "flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left transition-colors",
              t.key === selectedKey ? "bg-brand/15" : "hover:bg-background/50",
            )}
          >
            <span className="font-medium">{t.otherName}</span>
            <span className="text-xs text-muted-foreground">{t.turnLabel}</span>
            <span className="mt-0.5 w-fit rounded-full bg-background px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              {t.role}
            </span>
          </button>
        ))}
      </aside>

      {/* Panel de chat */}
      <div className="flex min-w-0 flex-col">
        {selectedThread ? (
          <>
            <header className="border-b border-border px-5 py-3">
              <div className="font-semibold">{selectedThread.otherName}</div>
              <div className="text-xs text-muted-foreground">
                {selectedThread.turnLabel}
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-5">
              {threadMessages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay mensajes todavía. ¡Escribe el primero!
                </p>
              ) : (
                threadMessages.map((m) => {
                  const mine = m.sender_id === userId;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <span
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          mine
                            ? "bg-brand text-brand-foreground"
                            : "bg-background text-foreground",
                        )}
                      >
                        {m.body}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={onSend} className="flex gap-2 border-t border-border p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe un mensaje…"
                maxLength={1000}
                autoComplete="off"
              />
              <Button type="submit" disabled={pending || !draft.trim()}>
                Enviar
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Selecciona una conversación.
          </div>
        )}
      </div>
    </div>
  );
}
