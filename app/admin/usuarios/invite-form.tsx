"use client";

import { useState, useTransition } from "react";
import { upsertUser } from "./actions";

export function InviteForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; message: string } | null
  >(null);

  return (
    <form
      action={(fd) => {
        setFeedback(null);
        startTransition(async () => {
          const res = await upsertUser(fd);
          setFeedback(
            res.ok
              ? { kind: "ok", message: res.message }
              : { kind: "err", message: res.error },
          );
          if (res.ok) {
            // Limpiar campos visibles
            const form = document.querySelector<HTMLFormElement>(
              "form[data-invite-form]",
            );
            form?.reset();
            setTimeout(() => setFeedback(null), 4000);
          }
        });
      }}
      data-invite-form
      className="grid sm:grid-cols-[2fr,1.5fr,auto,auto] gap-3 items-end"
    >
      <div>
        <label
          htmlFor="invite-email"
          className="block text-[0.65rem] uppercase tracking-[0.22em] text-muted mb-2"
        >
          Correo
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          disabled={isPending}
          placeholder="nombre@dominio.com"
          className="w-full bg-transparent border-b border-line py-2 text-base outline-none focus:border-accent transition-colors disabled:opacity-40"
        />
      </div>
      <div>
        <label
          htmlFor="invite-name"
          className="block text-[0.65rem] uppercase tracking-[0.22em] text-muted mb-2"
        >
          Nombre <span className="normal-case opacity-60">(opcional)</span>
        </label>
        <input
          id="invite-name"
          name="full_name"
          type="text"
          disabled={isPending}
          placeholder="Cómo aparecerá en el comité"
          className="w-full bg-transparent border-b border-line py-2 text-base outline-none focus:border-accent transition-colors disabled:opacity-40"
        />
      </div>
      <div>
        <label
          htmlFor="invite-role"
          className="block text-[0.65rem] uppercase tracking-[0.22em] text-muted mb-2"
        >
          Rol
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="voter"
          disabled={isPending}
          className="bg-byma-black border border-line py-2 px-3 text-sm outline-none focus:border-accent transition-colors disabled:opacity-40"
        >
          <option value="voter">Votante</option>
          <option value="admin">Comité</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 bg-accent text-byma-black hover:bg-byma-cream transition-colors text-xs uppercase tracking-[0.22em] font-medium disabled:opacity-40 whitespace-nowrap"
      >
        {isPending ? "Guardando…" : "Invitar"}
      </button>

      {feedback && (
        <p
          className={`sm:col-span-4 text-sm ${
            feedback.kind === "ok" ? "text-accent" : "text-byma-red"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
