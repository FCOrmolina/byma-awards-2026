import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Asegura que hay un usuario autenticado Y que está en el allowlist.
 * Si no, redirige a /login. Devuelve { user, role, isAdmin }.
 *
 * Usar en cualquier server component que requiera sesión.
 */
export async function requireAuth() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: roleData } = await supabase.rpc("current_role");
  const role = (roleData as string | null) ?? null;

  if (!role) {
    // Autenticado en Supabase pero ya no está en el allowlist.
    await supabase.auth.signOut();
    redirect("/login?error=Tu+acceso+ha+sido+revocado.");
  }

  return { user, role, isAdmin: role === "admin" };
}

export async function requireAdmin() {
  const auth = await requireAuth();
  if (!auth.isAdmin) {
    redirect("/");
  }
  return auth;
}
