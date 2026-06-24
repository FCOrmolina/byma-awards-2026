"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Result = { ok: true; message: string } | { ok: false; error: string };

export async function upsertUser(formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "voter");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Escribe un correo válido." };
  }
  if (role !== "voter" && role !== "admin") {
    return { ok: false, error: "Rol inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_upsert_user", {
    p_email: email,
    p_full_name: fullName || null,
    p_role: role,
  });

  if (error) {
    console.error("[admin] upsertUser failed", {
      email,
      code: error.code,
      message: error.message,
    });
    if (error.code === "42501") {
      return { ok: false, error: "No tienes permisos para esta acción." };
    }
    return { ok: false, error: error.message ?? "No pudimos guardar." };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `${email} guardado como ${role === "admin" ? "comité" : "votante"}.`,
  };
}

export async function getVoterCategories(
  email: string,
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Falta el correo." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_voter_categories", {
    p_email: clean,
  });

  if (error) {
    console.error("[admin] getVoterCategories failed", {
      email: clean,
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: error.message ?? "No pudimos cargar." };
  }

  const ids = ((data ?? []) as { category_id: string }[]).map(
    (r) => r.category_id,
  );
  return { ok: true, ids };
}

export async function setVoterCategories(
  email: string,
  categoryIds: string[],
): Promise<Result> {
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Falta el correo." };
  if (!Array.isArray(categoryIds)) {
    return { ok: false, error: "Lista de categorías inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_voter_categories", {
    p_email: clean,
    p_category_ids: categoryIds,
  });

  if (error) {
    console.error("[admin] setVoterCategories failed", {
      email: clean,
      count: categoryIds.length,
      code: error.code,
      message: error.message,
    });
    if (error.code === "42501") {
      return { ok: false, error: "No tienes permisos para esta acción." };
    }
    return { ok: false, error: error.message ?? "No pudimos guardar." };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/");
  return {
    ok: true,
    message:
      categoryIds.length === 0
        ? "Acceso completo a las 28 categorías."
        : `Acceso restringido a ${categoryIds.length} categoría${categoryIds.length === 1 ? "" : "s"}.`,
  };
}

export async function removeUser(formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Falta el correo." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_remove_user", { p_email: email });

  if (error) {
    console.error("[admin] removeUser failed", {
      email,
      code: error.code,
      message: error.message,
    });
    if (error.code === "42501") {
      return { ok: false, error: "No tienes permisos para esta acción." };
    }
    return { ok: false, error: error.message ?? "No pudimos eliminar." };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return { ok: true, message: `${email} quitado del allowlist.` };
}
