import { NextResponse, type NextRequest } from "next/server";
import { getSafeViewerRedirect } from "@/lib/safe-viewer-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeViewerRedirect(requestUrl.searchParams.get("next"));
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = "";

  if (code) {
    const supabase = await createClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(redirectUrl);
}
