import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BUCKETS, BUCKET_ORDER, type Bucket } from "@/lib/categories";

type VoterInfo = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: "voter" | "admin" | null;
};

type ProposalRow = {
  candidate_id: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  category_bucket: Bucket;
  category_sort_order: number;
  slot: number;
  name: string;
  justification: string | null;
  created_at: string;
};

const TOTAL_CATEGORIES = 28;

export default async function VoterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: infoRows }, { data: proposalRows }] = await Promise.all([
    supabase.rpc("admin_voter_info", { p_user_id: id }),
    supabase.rpc("admin_voter_proposals", { p_user_id: id }),
  ]);

  const info = ((infoRows ?? []) as VoterInfo[])[0];
  if (!info) notFound();

  const proposals = (proposalRows ?? []) as ProposalRow[];

  // Agrupar por categoría
  const byCategory = new Map<
    string,
    {
      category_name: string;
      category_slug: string;
      category_bucket: Bucket;
      category_sort_order: number;
      items: ProposalRow[];
    }
  >();
  for (const p of proposals) {
    const existing = byCategory.get(p.category_id);
    if (existing) {
      existing.items.push(p);
    } else {
      byCategory.set(p.category_id, {
        category_name: p.category_name,
        category_slug: p.category_slug,
        category_bucket: p.category_bucket,
        category_sort_order: p.category_sort_order,
        items: [p],
      });
    }
  }

  // Agrupar categorías por bucket
  const byBucket = new Map<Bucket, ProposalRow[][]>();
  const sortedCats = [...byCategory.values()].sort(
    (a, b) => a.category_sort_order - b.category_sort_order,
  );
  for (const cat of sortedCats) {
    const list = byBucket.get(cat.category_bucket) ?? [];
    list.push(cat.items);
    byBucket.set(cat.category_bucket, list);
  }

  const categoriesCovered = byCategory.size;
  const withJustification = proposals.filter(
    (p) => p.justification && p.justification.trim().length > 0,
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
      <Link
        href="/admin/usuarios"
        className="inline-block text-xs uppercase tracking-[0.25em] text-muted hover:text-accent transition-colors mb-10"
      >
        ← Volver a usuarios
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-xs uppercase tracking-[0.32em] text-accent">
            {info.role === "admin" ? "Comité" : "Votante"}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.02] tracking-[-0.025em]">
          {info.full_name || (
            <span className="text-muted italic">Sin nombre</span>
          )}
        </h1>
        <p className="mt-3 text-foreground/70 font-mono text-sm">
          {info.email}
        </p>
      </header>

      {/* Stats */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line mb-12">
        <Stat label="Propuestas" value={proposals.length} />
        <Stat
          label="Categorías"
          value={`${categoriesCovered}/${TOTAL_CATEGORIES}`}
          highlight={categoriesCovered === TOTAL_CATEGORIES}
        />
        <Stat
          label="Avance"
          value={`${Math.round((categoriesCovered / TOTAL_CATEGORIES) * 100)}%`}
        />
        <Stat
          label="Con justificación"
          value={
            proposals.length > 0
              ? `${Math.round((withJustification / proposals.length) * 100)}%`
              : "—"
          }
        />
      </dl>

      {proposals.length === 0 ? (
        <div className="border border-line p-10 text-center">
          <p className="text-foreground/70 mb-2">
            Este usuario aún no ha hecho propuestas.
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            Cuando entre y proponga, aparecerá aquí
          </p>
        </div>
      ) : (
        BUCKET_ORDER.map((bucketKey) => {
          const bucketCats = byBucket.get(bucketKey) ?? [];
          if (bucketCats.length === 0) return null;
          const meta = BUCKETS[bucketKey];
          return (
            <section key={bucketKey} className="mb-12">
              <div className="flex items-baseline justify-between gap-4 mb-5 pb-3 border-b border-line">
                <h2
                  className="font-display text-2xl leading-none"
                  style={{ color: meta.accent }}
                >
                  {meta.label}
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] text-muted">
                  {bucketCats.length} categoría
                  {bucketCats.length === 1 ? "" : "s"}
                </span>
              </div>

              <ul className="space-y-4">
                {bucketCats.map((items) => {
                  const cat = items[0];
                  return (
                    <li
                      key={cat.category_id}
                      className="border border-line bg-background/40"
                    >
                      <div className="flex items-baseline justify-between gap-3 px-5 py-3 border-b border-line">
                        <div className="flex items-baseline gap-3 min-w-0">
                          <span className="font-mono text-xs text-muted shrink-0">
                            /{String(cat.category_sort_order).padStart(2, "0")}
                          </span>
                          <Link
                            href={`/admin/categorias/${cat.category_slug}`}
                            className="font-display text-lg hover:text-accent transition-colors"
                          >
                            {cat.category_name}
                          </Link>
                        </div>
                        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted whitespace-nowrap">
                          {items.length}/5 slots
                        </span>
                      </div>

                      <ol className="divide-y divide-[color:var(--line)]">
                        {items
                          .sort((a, b) => a.slot - b.slot)
                          .map((p) => (
                            <li
                              key={p.candidate_id}
                              className="px-5 py-4 flex gap-4 items-start"
                            >
                              <span
                                className={`font-display text-base tabular-nums leading-none w-7 shrink-0 ${
                                  p.slot <= 3 ? "text-accent" : "text-muted"
                                }`}
                              >
                                {String(p.slot).padStart(2, "0")}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-display text-lg leading-tight">
                                  {p.name}
                                </p>
                                {p.justification &&
                                p.justification.trim().length > 0 ? (
                                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed border-l-2 border-line pl-3 italic">
                                    &ldquo;{p.justification}&rdquo;
                                  </p>
                                ) : (
                                  <p className="mt-1 text-xs text-muted italic">
                                    Sin justificación
                                  </p>
                                )}
                              </div>
                              <span
                                className={`text-[0.6rem] uppercase tracking-[0.2em] whitespace-nowrap ${
                                  p.slot <= 3 ? "text-accent" : "text-muted"
                                }`}
                              >
                                {p.slot <= 3 ? "Obligatorio" : "Opcional"}
                              </span>
                            </li>
                          ))}
                      </ol>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <dt className="text-[0.6rem] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd
        className={`font-display text-2xl sm:text-3xl mt-1.5 tabular-nums ${
          highlight ? "text-accent" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
