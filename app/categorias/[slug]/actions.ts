"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SlotInput = {
  slot: number;
  name: string;
  justification: string;
};

type Result = { ok: true } | { ok: false; error: string };

export async function saveCandidates(
  categoryId: string,
  slug: string,
  slots: SlotInput[],
): Promise<Result> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  // Slots 1-3 son obligatorios.
  for (const s of slots) {
    if (s.slot >= 1 && s.slot <= 3 && !s.name.trim()) {
      return {
        ok: false,
        error: `El candidato ${s.slot} es obligatorio. Llena nombre o vacíalos todos para cancelar.`,
      };
    }
  }

  const toUpsert = slots
    .filter((s) => s.name.trim().length > 0)
    .map((s) => ({
      user_id: user.id,
      category_id: categoryId,
      slot: s.slot,
      name: s.name.trim(),
      justification: s.justification.trim() || null,
    }));

  const slotsToDelete = slots
    .filter((s) => s.name.trim().length === 0)
    .map((s) => s.slot);

  if (slotsToDelete.length > 0) {
    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .in("slot", slotsToDelete);
    if (error) return { ok: false, error: error.message };
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("candidates")
      .upsert(toUpsert, { onConflict: "user_id,category_id,slot" });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/categorias/${slug}`);
  revalidatePath("/");
  return { ok: true };
}
