"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestCode, verifyCode } from "./actions";

type State =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; info: string; error?: string };

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "email" });
  const [isPending, startTransition] = useTransition();

  if (state.step === "code") {
    return (
      <form
        action={(fd) => {
          const token = String(fd.get("token") ?? "");
          startTransition(async () => {
            const res = await verifyCode(state.email, token);
            if (res.ok) {
              router.push(next || "/");
              router.refresh();
            } else {
              setState({ ...state, error: res.error });
            }
          });
        }}
        className="space-y-5"
      >
        <p className="text-sm text-foreground/80 leading-relaxed">
          {state.info}
        </p>

        <div className="space-y-2">
          <label
            htmlFor="token"
            className="block text-xs uppercase tracking-[0.18em] text-muted"
          >
            Código de 6 dígitos
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]+"
            maxLength={10}
            required
            autoFocus
            disabled={isPending}
            placeholder="••••••"
            className="w-full bg-transparent border-b border-line py-3 text-2xl tracking-[0.5em] outline-none focus:border-accent transition-colors disabled:opacity-40 font-mono placeholder:text-muted/40"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-accent text-byma-black hover:bg-byma-cream transition-colors text-sm uppercase tracking-[0.22em] font-medium disabled:opacity-40"
        >
          {isPending ? "Verificando…" : "Entrar"}
        </button>

        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setState({ step: "email" })}
            className="text-muted hover:text-foreground transition-colors uppercase tracking-[0.18em] disabled:opacity-40"
          >
            ← Cambiar correo
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const fd = new FormData();
              fd.set("email", state.email);
              startTransition(async () => {
                const res = await requestCode(fd);
                if (res.ok) {
                  setState({
                    step: "code",
                    email: res.email,
                    info: "Te enviamos otro código. El anterior queda inválido.",
                  });
                } else {
                  setState({ ...state, error: res.error });
                }
              });
            }}
            className="text-muted hover:text-accent transition-colors uppercase tracking-[0.18em] disabled:opacity-40"
          >
            Reenviar código
          </button>
        </div>

        {state.error && (
          <p className="text-sm text-byma-red leading-relaxed">{state.error}</p>
        )}
      </form>
    );
  }

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          const res = await requestCode(fd);
          if (res.ok) {
            setState({
              step: "code",
              email: res.email,
              info: res.message,
            });
          } else {
            setState({ step: "email", error: res.error });
          }
        });
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs uppercase tracking-[0.18em] text-muted"
        >
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="tu@correo.com"
          className="w-full bg-transparent border-b border-line py-3 text-lg outline-none focus:border-accent transition-colors disabled:opacity-40"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-accent text-byma-black hover:bg-byma-cream transition-colors text-sm uppercase tracking-[0.22em] font-medium disabled:opacity-40"
      >
        {isPending ? "Enviando código…" : "Enviar código"}
      </button>

      {state.error && (
        <p className="text-sm text-byma-red leading-relaxed">{state.error}</p>
      )}
    </form>
  );
}
