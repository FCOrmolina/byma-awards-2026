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
        <div className="lg:hidden mb-10">
          <Logo width={150} />
          <div className="mt-4 h-px w-24 bg-accent" />
        </div>

        <p className="text-xs uppercase tracking-[0.32em] text-accent mb-5">
          Acceso comité · votantes
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.02] mb-4 tracking-[-0.025em]">
          Entra a BYMA{" "}
          <span className="text-accent">2026</span>
        </h1>
        <p className="text-foreground/70 mb-10 leading-relaxed max-w-md">
          Solo participantes invitados. Escribe tu correo y te enviaremos un
          código de 6 dígitos para entrar — sin contraseña.
        </p>
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
      </div>
    </main>
  );
}
