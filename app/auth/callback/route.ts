import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  const supabase = await createSupabaseServerClient();

  let exchangeError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
      token_hash: tokenHash,
    });
    if (error) exchangeError = error.message;
  } else {
    exchangeError = "Enlace de acceso inválido.";
  }

  if (exchangeError) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", exchangeError);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(next, origin));
}
