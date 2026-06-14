import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Card, CardHeader } from "@/components/card";

export function RestrictedAccessNotice({
  title = "该内容暂未公开或需要授权访问",
  description = "当前公开页面无法显示这项内容。如果你希望查看相关研究材料，可以提交访问申请，管理员审核后再决定是否开放。",
  loginHref = "/viewer/login",
  requestHref = "/access-request",
  backHref,
  backLabel = "返回公开列表"
}: {
  title?: string;
  description?: string;
  loginHref?: string;
  requestHref?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
      <Card className="border-slate-200 bg-white text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <LockKeyhole size={24} />
        </div>
        <CardHeader title={title} description={description} />
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={requestHref} className="public-cta-motion rounded-2xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">
            申请访问
          </Link>
          <Link href={loginHref} className="public-cta-motion rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
            已获授权，邮箱登录
          </Link>
          {backHref ? (
            <Link href={backHref} className="public-cta-motion rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
              {backLabel}
            </Link>
          ) : null}
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">申请不会自动授权；授权访问也只开放对应内容详情，不开放后台、内部附件库、Storage 路径或附件下载。</p>
      </Card>
    </section>
  );
}
