import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, ExternalLink, ShieldCheck } from "lucide-react";
import { revokeAccessGrantAction } from "@/actions/access-grants";
import { AdminDangerZone, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getAccessGrantContentTypeLabel, getAccessGrantStatusLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import { getAccessGrantById, getAccessGrantEffectiveStatus, type AccessGrantEffectiveStatus } from "@/lib/queries/access-grants";
import { cn, visibilityLabel } from "@/lib/utils";

function statusClass(status: AccessGrantEffectiveStatus) {
  return cn(
    status === "active" && "bg-emerald-50 text-emerald-700 ring-emerald-100",
    status === "expired" && "bg-amber-50 text-amber-700 ring-amber-100",
    status === "revoked" && "bg-slate-100 text-slate-700 ring-slate-200"
  );
}

function statusLabel(status: AccessGrantEffectiveStatus) {
  if (status === "expired") {
    return "已过期";
  }

  return getAccessGrantStatusLabel(status);
}

function statusDescription(status: AccessGrantEffectiveStatus) {
  if (status === "active") {
    return "该邮箱当前具备这条 restricted 内容的访问条件。";
  }

  if (status === "expired") {
    return "该授权已超过有效期，不再提供访问条件。";
  }

  return "该授权已撤销，不再提供访问条件。";
}

export default async function AccessGrantDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grant = await getAccessGrantById(id);

  if (!grant) {
    notFound();
  }

  const effectiveStatus = getAccessGrantEffectiveStatus(grant);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Grant"
          title="访问授权详情"
          description="查看单条 restricted 内容授权。授权记录只控制指定邮箱访问指定内容，不触发 Documents 或公开附件规则变化。"
          action={
            <Link href="/dashboard/access-grants" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回列表
            </Link>
          }
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(effectiveStatus)}>{statusLabel(effectiveStatus)}</Badge>
                <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{getAccessGrantContentTypeLabel(grant.content_type)}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{grant.target?.title ?? "内容不存在或当前不可读取"}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{statusDescription(effectiveStatus)}</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <span className="rounded-2xl bg-slate-50 px-3 py-2">创建：{formatDateTime(grant.created_at)}</span>
              <span className="rounded-2xl bg-slate-50 px-3 py-2">更新：{formatDateTime(grant.updated_at)}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0 space-y-5">
            <Card>
              <CardHeader title="授权对象" description="授权以邮箱为粒度，只对该邮箱登录的 viewer 生效。" />
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <InfoBlock label="授权邮箱" value={grant.grantee_email} allowBreak />
                <InfoBlock label="授权状态" value={statusLabel(effectiveStatus)} />
                <InfoBlock label="创建时间" value={formatDateTime(grant.created_at)} />
                <InfoBlock label="过期时间" value={grant.expires_at ? formatDateTime(grant.expires_at) : "长期有效"} />
                <InfoBlock label="撤销时间" value={grant.status === "revoked" ? formatDateTime(grant.updated_at) : "未撤销"} />
                <InfoBlock label="更新时间" value={formatDateTime(grant.updated_at)} />
              </dl>
            </Card>

            <Card>
              <CardHeader
                title="授权内容"
                description="授权必须指向一条具体 restricted 内容；它不会改变内容 visibility。"
                action={grant.target ? (
                  <Link href={grant.target.adminHref} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                    内容后台
                    <ExternalLink size={14} />
                  </Link>
                ) : null}
              />
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <InfoBlock label="内容类型" value={getAccessGrantContentTypeLabel(grant.content_type)} />
                <InfoBlock label="内容标题" value={grant.target?.title ?? "无法显示"} />
                <InfoBlock label="内容 slug" value={grant.target?.slug ?? "无法显示"} />
                <InfoBlock label="内容 visibility" value={grant.target ? visibilityLabel(grant.target.visibility) : "未知"} />
                <InfoBlock label="公开 / viewer 路径" value={grant.target?.href ?? "无法显示"} allowBreak />
                <InfoBlock label="来源申请" value="当前 schema 未记录 request_id" />
              </dl>
            </Card>

            <Card>
              <CardHeader title="内部备注" description="备注仅后台可见，不会发送给外部用户。" />
              {grant.admin_note ? (
                <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{grant.admin_note}</p>
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">暂无内部备注。</p>
              )}
            </Card>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <AdminSecurityNote>
              Access Grant 只控制 restricted 正文访问条件，不开放 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL，也不影响 public attachment 下载规则。
            </AdminSecurityNote>

            <Card className="border-blue-100 bg-blue-50/60">
              <CardHeader title="安全边界" />
              <div className="space-y-3 text-sm leading-6 text-blue-800">
                <BoundaryItem>不会删除或修改 Access Request。</BoundaryItem>
                <BoundaryItem>不会修改内容 visibility。</BoundaryItem>
                <BoundaryItem>不会开放 Documents 或私密附件。</BoundaryItem>
                <BoundaryItem>不会生成 signed URL 或公开 Storage 路径。</BoundaryItem>
              </div>
            </Card>

            {grant.status === "active" ? (
              <AdminDangerZone description="撤销只会取消这条 restricted 内容授权，不删除内容、不删除申请、不影响公开页面。">
                <form action={revokeAccessGrantAction.bind(null, grant.id)}>
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800">
                    <Ban size={15} />
                    撤销授权
                  </button>
                </form>
              </AdminDangerZone>
            ) : null}
          </aside>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function InfoBlock({ label, value, allowBreak = false }: { label: string; value: string; allowBreak?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={cn("mt-1 font-medium text-slate-900", allowBreak ? "break-all" : "truncate")}>{value}</dd>
    </div>
  );
}

function BoundaryItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <ShieldCheck className="mt-1 shrink-0" size={15} />
      <span>{children}</span>
    </div>
  );
}
