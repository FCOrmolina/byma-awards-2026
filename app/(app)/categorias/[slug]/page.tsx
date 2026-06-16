import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BACKGROUNDS, BUCKETS, type Category } from "@/lib/categories";
import { Sigil, Stack } from "@/components/brand";
import { CandidatesForm } from "./candidates-form";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, slug, name, description, color_key, bucket, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();
  const cat = category as Category;
  const bucketMeta = BUCKETS[cat.bucket];

  const { data: existing } = await supabase
    .from("candidates")
    .select("slot, name, justification")
    .eq("category_id", cat.id)
    .order("slot");

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b border-line">
        <Image
          src={BACKGROUNDS[cat.color_key]}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-byma-black/40 via-byma-black/75 to-byma-black" />

        <Stack
          className="absolute -top-8 -right-16 opacity-60 pointer-events-none hidden xl:block select-none -z-10"
          width={260}
        />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 pt-12 pb-20 sm:pt-16 sm:pb-28">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-byma-cream/70 hover:text-accent transition-colors mb-10"
          >
            <span aria-hidden>←</span> Todas las categorías
          </Link>

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span
              className="h-px w-10"
              style={{ background: bucketMeta.accent }}
            />
            <span
              className="font-display text-sm uppercase tracking-[0.22em]"
              style={{ color: bucketMeta.accent }}
            >
              {bucketMeta.label}
            </span>
            <span className="text-byma-cream/40">·</span>
            <span className="font-mono text-xs tracking-[0.22em] text-byma-cream/70">
              /{String(cat.sort_order).padStart(2, "0")}
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-[5rem] leading-[0.95] max-w-4xl">
            {cat.name}
          </h1>
          <p className="mt-8 text-lg text-byma-cream/85 max-w-2xl leading-relaxed">
            {cat.description}
          </p>
        </div>
      </header>

      <section className="relative max-w-3xl mx-auto px-6 sm:px-10 py-16">
        <Sigil
          className="absolute -top-24 -left-40 opacity-[0.06] pointer-events-none hidden lg:block select-none"
          size={420}
        />

        <div className="relative mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-accent mb-3">
            Tu propuesta
          </p>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">
            Hasta cinco nombres por categoría.
          </h2>
          <p className="mt-4 text-foreground/70 leading-relaxed max-w-xl">
            Los primeros tres son obligatorios; los dos últimos son opcionales
            si quieres ampliar tu shortlist. La justificación es opcional, pero
            ayuda al comité a entender tu lectura.
          </p>
        </div>

        <CandidatesForm
          categoryId={cat.id}
          slug={cat.slug}
          existing={(existing ?? []) as { slot: number; name: string; justification: string | null }[]}
        />
      </section>
    </article>
  );
}
