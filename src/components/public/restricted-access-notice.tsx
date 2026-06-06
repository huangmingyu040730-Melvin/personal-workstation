import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Card, CardHeader } from "@/components/card";

export function RestrictedAccessNotice({
  title = "该内容需要授权访问",
  description = "这条内容可能不存在、尚未公开，或需要管理员按邮箱授权后才能查看。",
  loginHref = "/viewer/login"
}: {
  title?: string;
  description?: string;
  loginHref?: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
      <Card className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <LockKeyhole size={24} />
        </div>
        <CardHeader title={title} description={description} />
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/access-request" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
            提交访问申请
          </Link>
          <Link href={loginHref} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
            已获授权，邮箱登录
          </Link>
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">授权访问只开放对应内容详情，不开放后台、文件中心或附件下载。</p>
      </Card>
    </section>
  );
}
