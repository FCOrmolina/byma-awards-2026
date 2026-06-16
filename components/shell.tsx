import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Logo } from "./brand";
import { SignOutButton } from "./sign-out-button";

/**
 * Server component que envuelve el contenido autenticado de la app:
 * header con nav + logo, main, footer.
 * Hace el auth check al renderizar — si no hay sesión, redirige a /login.
 */
export async function Shell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await requireAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line backdrop-blur-sm bg-byma-black/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10 py-5">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo
              width={120}
              className="opacity-95 group-hover:opacity-100 transition-opacity"
            />
            <span className="hidden sm:inline text-xs uppercase tracking-[0.28em] text-muted border-l border-line pl-3">
              2026
            </span>
          </Link>
          <nav className="flex items-center gap-5 sm:gap-7 text-sm">
            <Link
              href="/"
              className="text-foreground/70 hover:text-accent transition-colors uppercase tracking-[0.18em] text-xs"
            >
              Categorías
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-foreground/70 hover:text-accent transition-colors uppercase tracking-[0.18em] text-xs"
              >
                Comité
              </Link>
            )}
            <span className="hidden md:inline text-muted text-xs">
              {user.email}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 text-xs text-muted flex flex-wrap gap-y-3 gap-x-6 justify-between items-center">
          <span className="uppercase tracking-[0.22em]">
            Beyond Music Awards · Edición 2026
          </span>
          <span className="uppercase tracking-[0.22em] text-foreground/70">
            Save the date · <span className="text-accent">26.08.26</span>
          </span>
          <span className="font-mono">nominaciones.byma.mx</span>
        </div>
      </footer>
    </div>
  );
}
