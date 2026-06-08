"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getSafeViewerRedirect } from "@/lib/safe-viewer-redirect";
import { isSupabaseConfigured, missingSupabaseConfigMessage } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const viewerLoginSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
  next: z.string().optional()
});

export type ViewerLoginState = {
  error?: string;
  success?: string;
};

export async function viewerLoginAction(_previousState: ViewerLoginState, formData: FormData): Promise<ViewerLoginState> {
  if (!isSupabaseConfigured) {
    return { error: missingSupabaseConfigMessage };
  }

  const parsed = viewerLoginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || "/"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "请检查登录邮箱。" };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: missingSupabaseConfigMessage };
  }

  const headerStore = await headers();
  const origin = getRequestOrigin(headerStore);
  const nextPath = getSafeViewerRedirect(parsed.data.next);
  const emailRedirectTo = origin ? buildViewerCallbackUrl(origin, nextPath) : undefined;
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  console.info("viewer login next path", { nextPath, hasRedirectOrigin: Boolean(origin) });

  const { data: canRequestLogin, error: grantCheckError } = await supabase.rpc("can_request_viewer_login", {
    viewer_email: normalizedEmail
  });

  if (grantCheckError) {
    console.error("viewerLoginAction grant check failed", { code: grantCheckError.code, message: grantCheckError.message });
    return { error: "授权检查失败，请稍后重试。" };
  }

  if (!canRequestLogin) {
    return { error: "该邮箱暂无有效授权，请先提交访问申请或联系管理员。" };
  }

  const cookieStore = await cookies();
  cookieStore.set("viewer-next", nextPath, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: origin.startsWith("https://")
  });

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo,
      shouldCreateUser: true
    }
  });

  if (error) {
    console.error("viewerLoginAction failed", { code: error.code, message: error.message });
    return { error: "邮件登录链接发送失败，请稍后重试；如持续失败，请联系管理员检查登录邮件配置。" };
  }

  return { success: "登录链接已发送，请在邮箱中打开链接后回到对应内容页查看。" };
}

function buildViewerCallbackUrl(origin: string, nextPath: string) {
  const callbackUrl = new URL("/viewer/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

function getRequestOrigin(headerStore: Headers) {
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return "";
  }

  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
