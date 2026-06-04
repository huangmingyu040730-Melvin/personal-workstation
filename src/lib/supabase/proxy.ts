import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseConfig } from "./config";

const protectedRoutes = [
  "/dashboard",
  "/calendar",
  "/documents",
  "/profile",
  "/settings",
  "/automations"
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function redirectTo(request: NextRequest, response: NextResponse, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const protectedRoute = isProtectedRoute(request.nextUrl.pathname);

  if (!isSupabaseConfigured || !supabaseConfig.url || !supabaseConfig.publishableKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  if (request.nextUrl.pathname === "/login" && claims) {
    const { data: isAdmin } = await supabase.rpc("is_admin");

    if (isAdmin) {
      return redirectTo(request, response, "/dashboard");
    }
  }

  if (!protectedRoute) {
    return response;
  }

  if (error || !claims) {
    return redirectTo(request, response, "/login", { next: request.nextUrl.pathname });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    return redirectTo(request, response, "/no-access");
  }

  return response;
}
