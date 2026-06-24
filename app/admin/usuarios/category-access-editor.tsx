"use client";

import { useEffect, useState, useTransition } from "react";
import { BUCKETS, BUCKET_ORDER, type Bucket } from "@/lib/categories";
import { getVoterCategories, setVoterCategories } from "./actions";

type CategoryLite = {
  id: string;
  name: string;
  bucket: Bucket;
  sort_order: number;
};

type Props = {
  email: string;
  totalCategories: number;
  /** null = ve todas (sin restricción); número = cuántas asignadas */
  assignedCount: number | null;
  allCategories: CategoryLite[];
};

export function CategoryAccessEditor({
  email,
  totalCategories,
  assignedCount,
  allCategories,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; message: string } | null
  >(null);

  // null = ve todas; Set = restringido a esos IDs
  const [selected, setSelected] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (selected !== null) return;
    setLoading(true);
    getVoterCategories(email)
      .then((res) => {
        if (res.ok) {
          setSelected(res.ids.length === 0 ? null : new Set(res.ids));
        } else {
          setFeedback({ kind: "err", message: res.error });
        }
      })
      .finally(() => setLoading(false));
  }, [open, email, selected]);

  const isRestricted = selected !== null;
  const selectedCount = selected?.size ?? totalCategories;

  const byBucket = new Map<Bucket, CategoryLite[]>();
  for (const c of allCategories) {
    const list = byBucket.get(c.bucket) ?? [];
    list.push(c);
    byBucket.set(c.bucket, list);
  }

  function toggleAll() {
    setFeedback(null);
    if (isRestricted) {
      setSelected(null);
    } else {
      setSelected(new Set());
    }
  }

  function toggleCategory(id: string) {
    setFeedback(null);
    if (!selected) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function bulkBucket(bucket: Bucket, allOn: boolean) {
    setFeedback(null);
    if (!selected) return;
    const next = new Set(selected);
    const ids = byBucket.get(bucket)?.map((c) => c.id) ?? [];
    if (allOn) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    setSelected(next);
  }

  function save() {
    setFeedback(null);
    const ids = selected ? Array.from(selected) : [];
    startTransition(async () => {
      const res = await setVoterCategories(email, ids);
      if (res.ok) {
        setFeedback({ kind: "ok", message: res.message });
        setTimeout(() => {
          setFeedback(null);
          setOpen(false);
        }, 1200);
      } else {
        setFeedback({ kind: "err", message: res.error });
      }
    });
  }

  const chip =
    assignedCount === null
      ? "Todas"
      : `${assignedCount} / ${totalCategories}`;
  const chipClass =
    assignedCount === null
      ? "text-foreground/70 border-line"
      : "text-accent border-accent/50";

  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] text-muted">
          <span>Categorías visibles</span>
          <span className={`px-2 py-0.5 border ${chipClass}`}>{chip}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[0.65rem] uppercase tracking-[0.22em] text-foreground/70 hover:text-accent transition-colors"
        >
          {open ? "Cerrar" : "Configurar"} {open ? "▲" : "▼"}
        </button>
      </div>

      {open && (
        <div className="mt-4 border border-line/60 p-4 bg-byma-black/40">
          {loading && selected === null ? (
            <p className="text-xs text-muted italic">Cargando…</p>
          ) : (
            <>
              <label className="flex items-center gap-3 pb-3 mb-3 border-b border-line/60 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!isRestricted}
                  onChange={toggleAll}
                  className="accent-[var(--byma-orange)] h-4 w-4"
                />
                <span className="font-display text-base">
                  Acceso a las {totalCategories} categorías
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted ml-auto">
                  {isRestricted ? `Restringido · ${selectedCount}` : "Sin restricción"}
                </span>
              </label>

              <div
                className={`grid gap-4 transition-opacity ${
                  isRestricted ? "opacity-100" : "opacity-40 pointer-events-none"
                }`}
              >
                {BUCKET_ORDER.map((bucket) => {
                  const cats = byBucket.get(bucket) ?? [];
                  if (cats.length === 0) return null;
                  const meta = BUCKETS[bucket];
                  const all = selected
                    ? cats.every((c) => selected.has(c.id))
                    : false;
                  const some = selected
                    ? cats.some((c) => selected.has(c.id))
                    : false;
                  return (
                    <div key={bucket} className="border border-line/40 p-3">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-px w-6"
                            style={{ background: meta.accent }}
                          />
                          <span
                            className="text-[0.7rem] uppercase tracking-[0.22em] font-display"
                            style={{ color: meta.accent }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => bulkBucket(bucket, all)}
                          disabled={!isRestricted}
                          className="text-[0.6rem] uppercase tracking-[0.22em] text-muted hover:text-accent transition-colors disabled:opacity-50"
                        >
                          {all
                            ? "Quitar todas"
                            : some
                              ? "Marcar todas"
                              : "Marcar todas"}
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {cats
                          .slice()
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((c) => {
                            const checked = selected?.has(c.id) ?? false;
                            return (
                              <li key={c.id}>
                                <label className="flex items-center gap-2.5 cursor-pointer text-sm hover:text-accent transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCategory(c.id)}
                                    disabled={!isRestricted}
                                    className="accent-[var(--byma-orange)] h-4 w-4"
                                  />
                                  <span>{c.name}</span>
                                </label>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-line/60 flex-wrap">
                {feedback ? (
                  <p
                    className={`text-xs ${
                      feedback.kind === "ok" ? "text-accent" : "text-byma-red"
                    }`}
                  >
                    {feedback.message}
                  </p>
                ) : (
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-muted">
                    {isRestricted
                      ? `Verá solo ${selectedCount} categoría${selectedCount === 1 ? "" : "s"}`
                      : "Verá todas las categorías"}
                  </p>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setSelected(null);
                      setFeedback(null);
                    }}
                    disabled={isPending}
                    className="text-[0.65rem] uppercase tracking-[0.22em] text-muted hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={isPending || (isRestricted && selectedCount === 0)}
                    className="px-4 py-2 bg-accent text-byma-black hover:bg-byma-cream transition-colors text-[0.65rem] uppercase tracking-[0.22em] font-medium disabled:opacity-40 whitespace-nowrap"
                  >
                    {isPending ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
