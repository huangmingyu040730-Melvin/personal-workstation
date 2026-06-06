import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeViewerRedirect } from "@/lib/safe-viewer-redirect";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";

function redirectToViewerLogin(request: NextRequest, next: string, error: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/viewer/login";
  url.search = "";
  url.searchParams.set("next", next);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const next = getSafeViewerRedirect(requestUrl.searchParams.get("next"));

  if (authError) {
    return redirectToViewerLogin(request, next, "expired");
  }

  if (!code) {
    return redirectToViewerLogin(request, next, "missing_code");
  }

  if (!isSupabaseConfigured || !supabaseConfig.url || !supabaseConfig.publishableKey) {
    return redirectToViewerLogin(request, next, "not_configured");
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = "";

  const response = NextResponse.redirect(redirectUrl);
  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("viewer callback exchange failed", { code: error.code, message: error.message });
    return redirectToViewerLogin(request, next, "exchange_failed");
  }

  return response;
}
