import { Logo, Sigil } from "@/components/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/" } = await searchParams;

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Columna izquierda: marca + copy */}
      <div className="relative overflow-hidden hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-line">
        <Sigil
          className="absolute -bottom-32 -left-32 opacity-[0.08] pointer-events-none select-none"
          size={620}
        />

        <div className="relative z-10">
          <Logo width={200} />
          <div className="mt-6 h-px w-32 bg-accent" />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-xs uppercase tracking-[0.32em] text-byma-cream/60 mb-5">
            Edición 2026 · Save the date · 26.08.26
          </p>
          <p className="font-display text-3xl xl:text-[2.5rem] leading-[1.1] text-byma-cream tracking-[-0.02em]">
            El reconocimiento a los creadores de la{" "}
            <span className="text-accent">experiencia musical</span> de habla
            hispana en el mundo.
          </p>
        </div>
      </div>

      {/* Columna derecha: form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 py-16 max-w-xl w-full mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-12 flex items-center gap-x-4 gap-y-2 flex-wrap tracking-[-0.025em]">
          <span>Acceso</span>
          <Logo width={130} className="inline-block translate-y-[2px]" />
          <span>Edición 2026</span>
        </h1>
        <LoginForm next={next} />
        <p className="mt-12 text-xs text-muted leading-relaxed">
          ¿No te llegó el código? Revisa la carpeta de spam o escríbenos a{" "}
          <a
            href="mailto:rmolina@fcogroup.mx"
            className="text-foreground/80 hover:text-accent transition-colors"
          >
            rmolina@fcogroup.mx
          </a>
          .
        </p>
        <div className="mt-10 pt-6 border-t border-line/60 flex items-center gap-3">
          <span className="text-[0.65rem] uppercase tracking-[0.28em] text-muted/80">
            Un <em className="italic text-foreground/80 font-medium">momento memorable</em> de
          </span>
          <a
            href="https://fcogroup.mx"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FCO Group"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <img
              src="https://galery-fco.sfo3.digitaloceanspaces.com/wp-content/uploads/2025/01/29181023/Logos-FCO-27.png"
              alt="FCO Group"
              width={72}
              height={24}
              className="h-6 w-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </a>
        </div>
      </div>
    </main>
  );
}
