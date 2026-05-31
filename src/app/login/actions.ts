"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeDashboardRedirect } from "@/lib/safe-redirect";
import { isSupabaseConfigured, missingSupabaseConfigMessage } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
  next: z.string().optional()
});

export type LoginState = {
  error?: string;
};

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    return { error: missingSupabaseConfigMessage };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || "/dashboard"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "请检查登录信息。" };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: missingSupabaseConfigMessage };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return { error: "登录失败，请检查邮箱、密码或 Supabase Auth 配置。" };
  }

  redirect(getSafeDashboardRedirect(parsed.data.next));
}

export async function signOutAction() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
