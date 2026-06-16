import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BUCKETS, type Category } from "@/lib/categories";

type CandidateRow = {
  id: string;
  slot: number;
  name: string;
  justification: string | null;
  created_at: string;
  user_id: string;
};

export default async function AdminCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const [
    { data: category },
    { count: invitedVoters },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, description, color_key, bucket, sort_order")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("allowed_emails")
      .select("email", { count: "exact", head: true })
      .eq("role", "voter"),
  ]);

  if (!category) notFound();
  const cat = category as Category;
  const bucketMeta = BUCKETS[cat.bucket];

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, slot, name, justification, created_at, user_id")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false });

  const rows = (candidates ?? []) as CandidateRow[];

  // Agrupa propuestas por nombre normalizado
  const grouped = new Map<
    string,
    { display: string; items: CandidateRow[] }
  >();
  for (const r of rows) {
    const key = r.name.trim().toLowerCase();
    const g = grouped.get(key) ?? { display: r.name.trim(), items: [] };
    g.items.push(r);
    grouped.set(key, g);
  }
  const ranking = [...grouped.entries()].sort(
    ([, a], [, b]) => b.items.length - a.items.length,
  );

  const uniqueVoters = new Set(rows.map((r) => r.user_id)).size;
  const withJustification = rows.filter(
    (r) => r.justification && r.justification.trim().length > 0,
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
      <Link
        href="/admin"
        className="inline-block text-xs uppercase tracking-[0.25em] text-muted hover:text-accent transition-colors mb-10"
      >
        ← Volver al dashboard
      </Link>

      <header className="mb-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className="font-display text-sm uppercase tracking-[0.22em]"
            style={{ color: bucketMeta.accent }}
          >
            {bucketMeta.label}
          </span>
          <span className="text-muted">·</span>
          <span className="font-mono text-xs tracking-[0.22em] text-muted">
            /{String(cat.sort_order).padStart(2, "0")}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-[-0.025em]">
          {cat.name}
        </h1>
        <p className="mt-5 text-foreground/70 leading-relaxed">
          {cat.description}
        </p>
      </header>

      {/* Stats bar */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line mb-12">
        <Stat label="Propuestas" value={rows.length} />
        <Stat label="Nombres únicos" value={grouped.size} />
        <Stat
          label="Votantes"
          value={
            invitedVoters ? `${uniqueVoters}/${invitedVoters}` : uniqueVoters
          }
        />
        <Stat
          label="Con justificación"
          value={
            rows.length > 0
              ? `${Math.round((withJustification / rows.length) * 100)}%`
              : "—"
          }
        />
      </dl>

      <section>
        <div className="flex items-baseline justify-between gap-4 mb-6 pb-3 border-b border-line">
          <h2 className="font-display text-2xl">Ranking</h2>
          <span className="text-xs uppercase tracking-[0.22em] text-muted">
            Por número de menciones
          </span>
        </div>

        {ranking.length === 0 ? (
          <div className="border border-line p-10 text-center">
            <p className="text-foreground/70 mb-2">
              Aún no hay propuestas para esta categoría.
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Los votantes apenas están empezando
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {ranking.map(([key, group], i) => {
              const count = group.items.length;
              const pct = rows.length > 0 ? (count / rows.length) * 100 : 0;
              const isLeader = i === 0;
              const justifications = group.items.filter(
                (r) => r.justification && r.justification.trim().length > 0,
              );

              return (
                <li
                  key={key}
                  className={`border ${
                    isLeader ? "border-accent/50" : "border-line"
                  } bg-background/40`}
                >
                  {/* Header del grupo */}
                  <div className="flex items-baseline gap-4 px-5 py-4 border-b border-line">
                    <span
                      className={`font-display text-2xl tabular-nums leading-none w-10 ${
                        isLeader ? "text-accent" : "text-muted"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-display text-xl leading-tight ${
                          isLeader ? "text-accent" : ""
                        }`}
                      >
                        {group.display}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-display text-2xl tabular-nums leading-none">
                        ×{count}
                      </span>
                      <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-muted mt-1 font-mono">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de proporción */}
                  <div className="px-5 pt-3">
                    <div className="h-[3px] bg-line overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: isLeader
                            ? "var(--byma-orange)"
                            : "var(--byma-cream)",
                          opacity: isLeader ? 1 : 0.4,
                        }}
                      />
                    </div>
                  </div>

                  {/* Justificaciones */}
                  <div className="px-5 py-4">
                    {justifications.length > 0 ? (
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-muted mb-3">
                          {justifications.length} justificación
                          {justifications.length === 1 ? "" : "es"}
                        </p>
                        <ul className="space-y-3">
                          {justifications.map((r) => (
                            <li
                              key={r.id}
                              className="border-l-2 border-line pl-4 py-1"
                            >
                              <p className="text-sm leading-relaxed text-foreground/85">
                                &ldquo;{r.justification}&rdquo;
                              </p>
                              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted mt-2 font-mono">
                                Votante {r.user_id.slice(0, 8)} · slot{" "}
                                {r.slot} ·{" "}
                                {new Date(r.created_at).toLocaleDateString(
                                  "es-MX",
                                  { day: "2-digit", month: "short" },
                                )}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic">
                        {count} propuesta{count === 1 ? "" : "s"} sin
                        justificación escrita.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <dt className="text-[0.6rem] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd className="font-display text-2xl sm:text-3xl mt-1.5 tabular-nums">
        {value}
      </dd>
    </div>
  );
}
