import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  return (
    <>
      <div className="border-b border-line bg-byma-black/40">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-3 flex items-center gap-6 text-xs uppercase tracking-[0.22em] overflow-x-auto">
          <span className="text-accent shrink-0">Comité</span>
          <span className="text-muted/60 shrink-0">/</span>
          <Link
            href="/admin"
            className="text-foreground/70 hover:text-foreground transition-colors shrink-0"
          >
            Resumen
          </Link>
          <Link
            href="/admin/usuarios"
            className="text-foreground/70 hover:text-foreground transition-colors shrink-0"
          >
            Usuarios
          </Link>
          <a
            href="/admin/export"
            className="text-foreground/70 hover:text-accent transition-colors shrink-0 ml-auto"
          >
            Exportar CSV ↓
          </a>
        </div>
      </div>
      {children}
    </>
  );
}
