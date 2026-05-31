import { LockKeyhole } from "lucide-react";
import Link from "next/link";

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <LockKeyhole size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-slate-950">暂无访问权限</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          当前账号已登录，但尚未被加入管理员白名单。请在 Supabase 的 admin_users 表中加入该用户 ID 后再访问后台。
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          返回公开首页
        </Link>
      </section>
    </main>
  );
}
