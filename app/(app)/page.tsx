import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BACKGROUNDS,
  BUCKETS,
  BUCKET_ORDER,
  type Bucket,
  type Category,
} from "@/lib/categories";
import { Stack } from "@/components/brand";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, description, color_key, bucket, sort_order")
    .order("sort_order");

  const cats = (categories ?? []) as Category[];

  const { data: myCounts } = await supabase
    .from("candidates")
    .select("category_id");

  const countMap = new Map<string, number>();
  (myCounts ?? []).forEach((row: { category_id: string }) => {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  });

  const byBucket = new Map<Bucket, Category[]>();
  for (const c of cats) {
    const list = byBucket.get(c.bucket) ?? [];
    list.push(c);
    byBucket.set(c.bucket, list);
  }

  const totalDone = cats.filter((c) => (countMap.get(c.id) ?? 0) >= 3).length;

  return (
    <div className="relative overflow-hidden">
      <Stack
        className="absolute -top-12 -right-24 opacity-70 pointer-events-none hidden xl:block select-none z-0"
        width={300}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20">
        <section className="mb-20 sm:mb-28 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-accent" />
            <p className="text-xs uppercase tracking-[0.32em] text-accent">
              Edición 2026 · Ronda abierta · 26.08.26
            </p>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.03em]">
            Más allá del{" "}
            <span className="text-accent">sonido</span>.
          </h1>

          <p className="mt-8 max-w-3xl text-foreground/80 leading-relaxed text-lg">
            BYMA reconoce a los creadores de la experiencia musical de habla
            hispana en el mundo — quienes trascienden de la interpretación a
            aquellos que <em className="text-foreground not-italic font-medium">construyen</em>,{" "}
            <em className="text-foreground not-italic font-medium">inspiran</em>,{" "}
            <em className="text-foreground not-italic font-medium">distribuyen</em>,{" "}
            <em className="text-foreground not-italic font-medium">protegen</em> y{" "}
            <em className="text-foreground not-italic font-medium">forjan</em> un
            legado más allá del sonido.
          </p>

          <p className="mt-6 max-w-2xl text-foreground/60 leading-relaxed">
            Entra a cada categoría, lee qué busca celebrar y propón hasta cinco
            candidatos: tres obligatorios, dos opcionales. Puedes editar tus
            propuestas hasta que cierre la ronda.
          </p>

          <div className="mt-12 flex flex-wrap gap-x-12 gap-y-4 text-xs uppercase tracking-[0.22em] text-muted">
            <span className="flex items-baseline gap-2">
              <strong className="font-display text-2xl text-foreground tabular-nums">
                {cats.length}
              </strong>
              categorías
            </span>
            <span className="flex items-baseline gap-2">
              <strong className="font-display text-2xl text-foreground tabular-nums">
                5
              </strong>
              buckets
            </span>
            <span className="flex items-baseline gap-2">
              <strong className="font-display text-2xl text-accent tabular-nums">
                {totalDone}
              </strong>
              completadas
            </span>
          </div>
        </section>

        {/* Mini-selector: salta directo a cualquier bucket */}
        <nav
          aria-label="Saltar a bucket"
          className="sticky top-[68px] z-20 -mx-6 sm:-mx-10 px-6 sm:px-10 py-3 mb-12 bg-byma-black/85 backdrop-blur-md border-y border-line"
        >
          <ul className="flex gap-2 sm:gap-3 overflow-x-auto -mb-1 pb-1">
            {BUCKET_ORDER.map((b) => {
              const meta = BUCKETS[b];
              const count = byBucket.get(b)?.length ?? 0;
              return (
                <li key={b} className="shrink-0">
                  <a
                    href={`#bucket-${b}`}
                    className="inline-flex items-baseline gap-2 px-3 sm:px-4 py-1.5 border text-xs uppercase tracking-[0.2em] hover:bg-foreground/5 transition-colors"
                    style={{
                      color: meta.accent,
                      borderColor: meta.accent,
                    }}
                  >
                    {meta.label}
                    <span className="font-mono text-[0.65rem] opacity-70">
                      {count}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {BUCKET_ORDER.map((bucketKey) => {
          const bucketCats = byBucket.get(bucketKey) ?? [];
          if (bucketCats.length === 0) return null;
          const meta = BUCKETS[bucketKey];
          return (
            <section
              key={bucketKey}
              id={`bucket-${bucketKey}`}
              className="mb-16 sm:mb-20 scroll-mt-32"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 pb-5 border-b border-line">
                <h2
                  className="font-display text-3xl sm:text-4xl leading-none"
                  style={{ color: meta.accent }}
                >
                  {meta.label}
                </h2>
                <span className="font-mono text-xs tracking-[0.2em] text-muted">
                  {bucketCats.length.toString().padStart(2, "0")} categorías
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bucketCats.map((c) => {
                  const count = countMap.get(c.id) ?? 0;
                  const done = count >= 3;
                  return (
                    <Link
                      key={c.id}
                      href={`/categorias/${c.slug}`}
                      className="group relative overflow-hidden border border-line aspect-[4/5] flex flex-col p-5 hover:border-accent/60 transition-all duration-500"
                    >
                      <Image
                        src={BACKGROUNDS[c.color_key]}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-right group-hover:scale-[1.03] transition-transform duration-700"
                      />
                      {/* Gradient ARRIBA — sostiene el texto, deja los platillos limpios abajo */}
                      <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-byma-black via-byma-black/85 via-30% to-transparent" />

                      <div className="relative flex items-start justify-between mb-5">
                        <span className="font-mono text-xs tracking-[0.2em] text-byma-cream/90">
                          /{String(c.sort_order).padStart(2, "0")}
                        </span>
                        <span
                          className={`text-[0.6rem] uppercase tracking-[0.2em] px-2 py-0.5 backdrop-blur-sm ${
                            done
                              ? "bg-accent/20 text-accent border border-accent/60"
                              : count > 0
                                ? "bg-byma-black/40 text-byma-cream/90 border border-byma-cream/30"
                                : "bg-byma-black/30 text-byma-cream/70 border border-byma-cream/15"
                          }`}
                        >
                          {count > 0 ? `${count}/5` : "Pendiente"}
                        </span>
                      </div>

                      <div className="relative">
                        <h3 className="font-display text-lg sm:text-xl leading-[1.15] mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                          {c.name}
                        </h3>
                        <span className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-byma-cream/85 group-hover:text-accent transition-colors">
                          Proponer
                          <span
                            aria-hidden
                            className="transition-transform group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {cats.length === 0 && (
          <div className="border border-line p-10 text-center text-foreground/70">
            Aún no hay categorías cargadas. Corre{" "}
            <code className="font-mono text-accent">
              supabase/migration-v2-categories.sql
            </code>{" "}
            en el SQL Editor de Supabase.
          </div>
        )}
      </div>
    </div>
  );
}
