"use client";

import { useTransition } from "react";
import { removeUser } from "./actions";

export function RemoveButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(`Quitar ${email} del allowlist? No podrá entrar más.`)
        ) {
          return;
        }
        startTransition(async () => {
          const fd = new FormData();
          fd.set("email", email);
          await removeUser(fd);
        });
      }}
      className="text-xs uppercase tracking-[0.2em] text-muted hover:text-byma-red transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Quitar"}
    </button>
  );
}
