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
