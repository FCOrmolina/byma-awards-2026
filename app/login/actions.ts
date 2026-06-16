"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type RequestResult =
  | { ok: true; email: string; message: string }
  | { ok: false; error: string };

type VerifyResult = { ok: true } | { ok: false; error: string };

export async function requestCode(formData: FormData): Promise<RequestResult> {
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return { ok: false, error: "Escribe un correo válido." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: allowed, error: rpcError } = await supabase.rpc(
    "email_is_allowed",
    { p_email: rawEmail },
  );

  if (rpcError) {
    return {
      ok: false,
      error: "No pudimos validar el correo en este momento. Inténtalo de nuevo.",
    };
  }

  if (!allowed) {
    return {
      ok: false,
      error:
        "Ese correo no está en la lista del comité. Si crees que es un error, escríbenos a rmolina@fcogroup.mx.",
    };
  }

  // Sin `emailRedirectTo` Supabase envía el correo con el código sin priorizar el link.
  const { error } = await supabase.auth.signInWithOtp({
    email: rawEmail,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error("[login] signInWithOtp failed", {
      email: rawEmail,
      status: error.status,
      code: error.code,
      message: error.message,
    });

    const msg = error.message?.toLowerCase() ?? "";
    if (error.status === 429 || msg.includes("rate") || msg.includes("limit")) {
      return {
        ok: false,
        error:
          "Demasiados intentos seguidos. Espera unos minutos antes de pedir otro código.",
      };
    }
    if (msg.includes("smtp") || msg.includes("send")) {
      return {
        ok: false,
        error:
          "El proveedor de correo está rechazando los envíos. Avisa a rmolina@fcogroup.mx.",
      };
    }
    return {
      ok: false,
      error: `No pudimos enviar el código (${error.code ?? error.status ?? "desconocido"}). Inténtalo de nuevo.`,
    };
  }

  return {
    ok: true,
    email: rawEmail,
    message: `Te enviamos un código de 6 dígitos a ${rawEmail}. Revísalo (también en spam) y pégalo aquí.`,
  };
}

export async function verifyCode(
  email: string,
  rawToken: string,
): Promise<VerifyResult> {
  const token = rawToken.replace(/\s+/g, "");

  if (!/^\d{6,10}$/.test(token)) {
    return {
      ok: false,
      error: "El código debe ser solo dígitos (entre 6 y 10).",
    };
  }

  const supabase = await createSupabaseServerClient();

  // Probamos los dos tipos posibles. Supabase usa `email` para login con OTP
  // a usuarios existentes; pero si el usuario nace con `signInWithOtp` y aún
  // no había confirmado correo, el tipo correcto es `signup`. Si el primero
  // falla con "invalid", intentamos el segundo antes de marcar error final.
  const types = ["email", "signup"] as const;
  let lastError: { status?: number; code?: string; message?: string } | null = null;

  for (const type of types) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (!error) return { ok: true };
    lastError = {
      status: error.status,
      code: error.code,
      message: error.message,
    };
    console.error("[login] verifyOtp failed", { email, type, ...lastError });
    // Si el error no menciona token inválido/expirado, no tiene sentido
    // intentar otro `type` — algo más estructural está mal.
    const msg = error.message?.toLowerCase() ?? "";
    if (!msg.includes("invalid") && !msg.includes("expired") && !msg.includes("token")) {
      break;
    }
  }

  const msg = lastError?.message?.toLowerCase() ?? "";
  if (msg.includes("expired")) {
    return { ok: false, error: "El código expiró. Pide uno nuevo." };
  }
  if (msg.includes("invalid") || msg.includes("token")) {
    return {
      ok: false,
      error: "Código incorrecto o ya usado. Revisa los 6 dígitos o pide uno nuevo.",
    };
  }
  return {
    ok: false,
    error: `No pudimos verificar el código (${lastError?.code ?? lastError?.status ?? "desconocido"}).`,
  };
}
