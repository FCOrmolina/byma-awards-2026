"use client";

import { useState, useTransition } from "react";
import { saveCandidates, type SlotInput } from "./actions";

type Existing = {
  slot: number;
  name: string;
  justification: string | null;
};

export function CandidatesForm({
  categoryId,
  slug,
  existing,
}: {
  categoryId: string;
  slug: string;
  existing: Existing[];
}) {
  const initial: SlotInput[] = Array.from({ length: 5 }, (_, i) => {
    const slot = i + 1;
    const found = existing.find((e) => e.slot === slot);
    return {
      slot,
      name: found?.name ?? "",
      justification: found?.justification ?? "",
    };
  });

  const [slots, setSlots] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  const update = (slot: number, patch: Partial<SlotInput>) =>
    setSlots((prev) =>
      prev.map((s) => (s.slot === slot ? { ...s, ...patch } : s)),
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setFeedback(null);
        startTransition(async () => {
          const res = await saveCandidates(categoryId, slug, slots);
          setFeedback(
            res.ok
              ? { kind: "ok", message: "Propuestas guardadas." }
              : { kind: "err", message: res.error },
          );
          if (res.ok) {
            setTimeout(() => setFeedback(null), 3500);
          }
        });
      }}
      className="space-y-5"
    >
      {slots.map((s) => {
        const required = s.slot <= 3;
        const filled = s.name.trim().length > 0;
        return (
          <div
            key={s.slot}
            className={`relative border p-5 sm:p-6 bg-byma-black/40 backdrop-blur-sm transition-colors ${
              filled ? "border-accent/50" : "border-line"
            }`}
          >
            <div className="flex items-baseline gap-4 mb-5">
              <span className="font-display text-3xl text-accent leading-none tabular-nums">
                {String(s.slot).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h3 className="font-display text-lg leading-none">
                  Candidato {s.slot}
                </h3>
                <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted mt-1 inline-block">
                  {required ? "Obligatorio" : "Opcional"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted mb-2">
                  Nombre del candidato / obra
                </label>
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => update(s.slot, { name: e.target.value })}
                  placeholder="Artista, ejecutivo, productor, álbum, canción…"
                  required={required}
                  className="w-full bg-transparent border-b border-line py-2 text-base outline-none focus:border-accent transition-colors placeholder:text-muted/60"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted mb-2">
                  Justificación{" "}
                  <span className="normal-case tracking-normal text-muted">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={s.justification}
                  onChange={(e) =>
                    update(s.slot, { justification: e.target.value })
                  }
                  rows={3}
                  placeholder="¿Por qué merece este reconocimiento? El comité leerá esto."
                  className="w-full bg-transparent border border-line p-3 text-base outline-none focus:border-accent transition-colors resize-y placeholder:text-muted/60"
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <p className="text-xs text-muted leading-relaxed max-w-sm">
          Puedes volver y editar mientras la ronda esté abierta.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="px-7 py-3.5 bg-accent text-byma-black hover:bg-byma-cream transition-colors text-sm uppercase tracking-[0.22em] font-medium disabled:opacity-40"
        >
          {isPending ? "Guardando…" : "Guardar propuestas"}
        </button>
      </div>

      {feedback && (
        <p
          className={
            feedback.kind === "ok"
              ? "text-sm text-accent"
              : "text-sm text-byma-red"
          }
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
