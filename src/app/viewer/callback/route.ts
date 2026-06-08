import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeViewerRedirect } from "@/lib/safe-viewer-redirect";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    target.cookies.set(name, value, options);
  });
}

function redirectToViewerLogin(request: NextRequest, next: string, error: string, cookieSource?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/viewer/login";
  url.search = "";
  url.searchParams.set("next", next);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);

  if (cookieSource) {
    copyResponseCookies(cookieSource, response);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const urlNext = requestUrl.searchParams.get("next");
  const cookieNext = request.cookies.get("viewer-next")?.value;
  const next = getSafeViewerRedirect(urlNext ?? cookieNext);

  console.info("viewer callback next path", { next, source: urlNext ? "url" : cookieNext ? "cookie" : "default" });

  if (authError) {
    return redirectToViewerLogin(request, next, "expired");
  }

  if (!code) {
    return redirectToViewerLogin(request, next, "missing_code");
  }

  if (!isSupabaseConfigured || !supabaseConfig.url || !supabaseConfig.publishableKey) {
    return redirectToViewerLogin(request, next, "not_configured");
  }

  let sessionCookieResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        sessionCookieResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => sessionCookieResponse.cookies.set(name, value, options));
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("viewer callback exchange failed", { code: error.code, message: error.message });
    return redirectToViewerLogin(request, next, "exchange_failed", sessionCookieResponse);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = "";
  const response = NextResponse.redirect(redirectUrl);
  copyResponseCookies(sessionCookieResponse, response);
  response.cookies.delete("viewer-next");

  return response;
}
