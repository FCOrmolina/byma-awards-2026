import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data, error } = await supabase
    .from("candidates")
    .select(
      `
      id,
      slot,
      name,
      justification,
      created_at,
      user_id,
      categories ( slug, name, bucket )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const header = [
    "bucket",
    "categoria_slug",
    "categoria",
    "slot",
    "nombre",
    "justificacion",
    "votante_user_id",
    "creado",
  ];

  const lines = [header.join(",")];

  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = (row as any).categories as {
      slug: string;
      name: string;
      bucket: string;
    } | null;
    lines.push(
      [
        csv(cat?.bucket ?? ""),
        csv(cat?.slug ?? ""),
        csv(cat?.name ?? ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        csv(String((row as any).slot)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        csv((row as any).name ?? ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        csv((row as any).justification ?? ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        csv((row as any).user_id ?? ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        csv((row as any).created_at ?? ""),
      ].join(","),
    );
  }

  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="byma-2026-propuestas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csv(v: string): string {
  if (v == null) return "";
  const needsQuote = /[",\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
