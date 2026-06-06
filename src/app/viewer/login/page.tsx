import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { getSafeViewerRedirect } from "@/lib/safe-viewer-redirect";
import { isSupabaseConfigured, missingSupabaseConfigMessage } from "@/lib/supabase/config";
import { ViewerLoginForm } from "./viewer-login-form";

export const metadata: Metadata = {
  title: "授权访问登录 | 黄铭语",
  description: "使用邮箱魔法链接登录，查看已授权的 restricted 内容。"
};

export default async function ViewerLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeViewerRedirect(rawNext);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-violet-50 p-8 shadow-soft">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <KeyRound size={24} />
          </div>
          <p className="mt-6 text-sm font-semibold text-blue-700">Restricted Access</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">授权访问登录</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            这里用于外部访客查看已获授权的 restricted 内容。登录后仍不能进入后台，也不能访问文件中心或私密附件。
          </p>
          {!isSupabaseConfigured ? (
            <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {missingSupabaseConfigMessage}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/" className="text-blue-700 hover:text-blue-900">返回公开首页</Link>
            <Link href="/access-request" className="text-blue-700 hover:text-blue-900">提交访问申请</Link>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">邮箱魔法链接</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">请输入管理员授权时使用的邮箱。系统会发送一次性登录链接，不需要设置密码。</p>
          <ViewerLoginForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}
