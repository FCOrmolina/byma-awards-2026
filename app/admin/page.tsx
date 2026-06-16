import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BUCKETS,
  BUCKET_ORDER,
  type Bucket,
  type Category,
} from "@/lib/categories";

type CandidateRow = {
  category_id: string;
  user_id: string;
  name: string;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: catsData }, { data: rowsData }, { count: totalVoters }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name, description, color_key, bucket, sort_order")
        .order("sort_order"),
      supabase.from("candidates").select("category_id, user_id, name"),
      supabase
        .from("allowed_emails")
        .select("email", { count: "exact", head: true })
        .eq("role", "voter"),
    ]);

  const categories = (catsData ?? []) as Category[];
  const rows = (rowsData ?? []) as CandidateRow[];
  const invitedVoters = totalVoters ?? 0;

  const stats = new Map<
    string,
    { total: number; voters: Set<string>; tally: Map<string, number> }
  >();
  const globalNames = new Set<string>();

  for (const r of rows) {
    let s = stats.get(r.category_id);
    if (!s) {
      s = { total: 0, voters: new Set(), tally: new Map() };
      stats.set(r.category_id, s);
    }
    s.total += 1;
    s.voters.add(r.user_id);
    const key = r.name.trim().toLowerCase();
    s.tally.set(key, (s.tally.get(key) ?? 0) + 1);
    globalNames.add(key);
  }

  const totalPropuestas = rows.length;
  const votantesActivos = new Set(rows.map((r) => r.user_id)).size;
  const categoriasActivas = stats.size;

  const byBucket = new Map<Bucket, Category[]>();
  for (const c of categories) {
    const list = byBucket.get(c.bucket) ?? [];
    list.push(c);
    byBucket.set(c.bucket, list);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.32em] text-accent mb-3">
          Resumen de la ronda
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1] tracking-[-0.02em]">
          Lectura de la ronda
        </h1>
        <p className="mt-3 text-sm text-muted">
          Edición 2026 · Actualizado en tiempo real
        </p>
      </header>

      {/* Stats: 4 métricas con contexto */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line mb-14">
        <Stat
          label="Propuestas totales"
          value={totalPropuestas}
          hint="Slots llenados por votantes"
        />
        <Stat
          label="Nombres únicos"
          value={globalNames.size}
          hint="Sin contar repeticiones"
        />
        <Stat
          label="Votantes activos"
          value={
            invitedVoters > 0
              ? `${votantesActivos}/${invitedVoters}`
              : votantesActivos
          }
          hint={
            invitedVoters > 0
              ? `${Math.round((votantesActivos / invitedVoters) * 100)}% participación`
              : "Han propuesto algo"
          }
          highlight={
            invitedVoters > 0 && votantesActivos / invitedVoters >= 0.5
          }
        />
        <Stat
          label="Cobertura"
          value={`${categoriasActivas}/${categories.length}`}
          hint="Categorías con al menos 1 propuesta"
          highlight={
            categories.length > 0 &&
            categoriasActivas / categories.length >= 0.8
          }
        />
      </dl>

      {/* Secciones por bucket */}
      {BUCKET_ORDER.map((bucketKey) => {
        const bucketCats = byBucket.get(bucketKey) ?? [];
        if (bucketCats.length === 0) return null;
        const meta = BUCKETS[bucketKey];
        const bucketTotal = bucketCats.reduce(
          (sum, c) => sum + (stats.get(c.id)?.total ?? 0),
          0,
        );
        return (
          <section key={bucketKey} className="mb-14">
            <div className="flex items-baseline justify-between gap-4 mb-5 pb-3 border-b border-line">
              <div className="flex items-baseline gap-4">
                <h2
                  className="font-display text-2xl leading-none"
                  style={{ color: meta.accent }}
                >
                  {meta.label}
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] text-muted">
                  {bucketCats.length} categorías · {bucketTotal} propuestas
                </span>
              </div>
            </div>

            <ul className="space-y-2">
              {bucketCats.map((c) => {
                const s = stats.get(c.id);
                const top3 = s
                  ? [...s.tally.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                  : [];
                const voterCount = s?.voters.size ?? 0;
                const participation =
                  invitedVoters > 0 ? voterCount / invitedVoters : 0;

                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/categorias/${c.slug}`}
                      className="block border border-line p-4 sm:p-5 hover:bg-foreground/[0.04] hover:border-accent/40 group transition-colors"
                    >
                      <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                        <div className="flex items-baseline gap-3 min-w-0">
                          <span className="font-mono text-xs tracking-wide text-muted shrink-0">
                            /{String(c.sort_order).padStart(2, "0")}
                          </span>
                          <p className="font-display text-lg group-hover:text-accent transition-colors">
                            {c.name}
                          </p>
                        </div>
                        <span className="tabular-nums text-xs uppercase tracking-[0.18em] text-muted whitespace-nowrap">
                          {s?.total ?? 0} propuesta
                          {(s?.total ?? 0) === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Barra de participación */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-[3px] bg-line overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(participation * 100, 100)}%`,
                              background:
                                participation >= 0.5
                                  ? "var(--byma-orange)"
                                  : "var(--byma-cream)",
                              opacity: participation > 0 ? 1 : 0,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted whitespace-nowrap font-mono">
                          {voterCount}
                          {invitedVoters > 0 ? `/${invitedVoters}` : ""}{" "}
                          votante{voterCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Top 3 */}
                      {top3.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {top3.map(([name, count], i) => (
                            <span
                              key={name}
                              className={`text-xs px-2 py-1 border ${
                                i === 0
                                  ? "border-accent/50 text-accent bg-accent/[0.04]"
                                  : "border-line text-foreground/70"
                              }`}
                            >
                              {capitalize(name)}
                              <span className="opacity-60 ml-1.5 tabular-nums">
                                ×{count}
                              </span>
                            </span>
                          ))}
                          {s && s.tally.size > 3 && (
                            <span className="text-xs px-2 py-1 text-muted italic">
                              +{s.tally.size - 3} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted italic">
                          Sin propuestas todavía
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-background p-5 sm:p-6">
      <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd
        className={`font-display text-3xl sm:text-4xl mt-2 tabular-nums ${
          highlight ? "text-accent" : ""
        }`}
      >
        {value}
      </dd>
      {hint && (
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted/80 mt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
