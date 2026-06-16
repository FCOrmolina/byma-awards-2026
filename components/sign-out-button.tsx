"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const supabase = createSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.push("/login");
          router.refresh();
        })
      }
      disabled={isPending}
      className="text-foreground/70 hover:text-accent transition-colors text-xs uppercase tracking-[0.18em] disabled:opacity-50"
    >
      {isPending ? "Saliendo…" : "Salir"}
    </button>
  );
}
