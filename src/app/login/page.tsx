import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { getSafeDashboardRedirect } from "@/lib/safe-redirect";
import { isSupabaseConfigured, missingSupabaseConfigMessage } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeDashboardRedirect(params.next);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-violet-50 p-8 shadow-soft">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <ShieldCheck size={24} />
          </div>
          <p className="mt-6 text-sm font-semibold text-blue-700">黄铭语个人数字工作站</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">管理员登录</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            工作台、研究中心、文件中心与系统设置属于后台区域。Phase 2A 使用 Supabase Auth 和 RLS 建立权限基础，页面数据仍保持 mock data 预览。
          </p>
          {!isSupabaseConfigured ? (
            <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {missingSupabaseConfigMessage}
            </p>
          ) : null}
          <Link href="/" className="mt-6 inline-flex text-sm font-medium text-blue-700 hover:text-blue-900">
            返回公开首页
          </Link>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">登录</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">请使用 Supabase Auth 中已创建并加入 admin_users 的管理员账号。</p>
          <LoginForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}
