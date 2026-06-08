import Link from "next/link";
import { Ban, Plus } from "lucide-react";
import { revokeAccessGrantAction } from "@/actions/access-grants";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { accessGrantContentTypes, accessGrantStatuses, getAccessGrantContentTypeLabel, getAccessGrantStatusLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getAccessGrants } from "@/lib/queries/access-grants";
import { cn, visibilityLabel } from "@/lib/utils";

function statusClass(status: string) {
  return cn(
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
    status === "active" && "bg-emerald-50 text-emerald-700",
    status === "revoked" && "bg-slate-100 text-slate-700"
  );
}

export default async function AccessGrantsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "all";
  const contentType = typeof params.content_type === "string" ? params.content_type : "all";
  const [grants] = await Promise.all([getAccessGrants({ status, contentType })]);
  const error = getFormError(params);

  return (
    <AppShell>
      <AdminPageSurface>
      <PageHeader
        eyebrow="Access Grants"
        title="访问授权"
        description="管理 restricted 内容的邮箱级只读授权。撤销后外部用户将无法继续查看对应内容。"
        action={
          <Link href="/dashboard/access-grants/new" className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
            <Plus size={16} />
            新建授权
          </Link>
        }
      />
      {error ? <Card className="mb-5 border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</Card> : null}
      <AdminSecurityNote>当前 restricted / viewer 登录链路仍有已知问题，授权记录可继续维护；最终外部查看体验需等待后续 Hotfix 验证。</AdminSecurityNote>
      <AdminSection>
      <form className="flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部状态</option>
          {accessGrantStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select name="content_type" defaultValue={contentType} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部内容类型</option>
          {accessGrantContentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
      </form>
      </AdminSection>
      <Card className="overflow-x-auto p-0">
        <div className="min-w-[1080px]">
          <div className="grid grid-cols-[1fr_0.55fr_1fr_0.55fr_0.5fr_0.75fr_0.75fr_0.45fr] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500">
            <span>邮箱</span>
            <span>类型</span>
            <span>内容</span>
            <span>内容权限</span>
            <span>状态</span>
            <span>有效期</span>
            <span>更新时间</span>
            <span>操作</span>
          </div>
          {grants.length === 0 ? (
            <div className="p-5"><AdminEmptyState title="暂无访问授权" description="创建授权后，指定邮箱会具备对应 restricted 内容的只读访问条件。" /></div>
          ) : grants.map((grant) => (
            <div key={grant.id} className="grid grid-cols-[1fr_0.55fr_1fr_0.55fr_0.5fr_0.75fr_0.75fr_0.45fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-blue-50/60 last:border-0">
              <span className="break-all font-medium text-slate-900">{grant.grantee_email}</span>
              <span className="text-slate-500">{getAccessGrantContentTypeLabel(grant.content_type)}</span>
              <span className="truncate text-slate-700">
                {grant.target ? <Link href={grant.target.href} className="font-medium text-blue-700 hover:text-blue-900">{grant.target.title}</Link> : "内容不存在或无权限读取"}
              </span>
              <span className="text-slate-500">{grant.target ? visibilityLabel(grant.target.visibility) : "未知"}</span>
              <span><span className={statusClass(grant.status)}>{getAccessGrantStatusLabel(grant.status)}</span></span>
              <span className="text-slate-500">{grant.expires_at ? formatDateTime(grant.expires_at) : "长期"}</span>
              <span className="text-slate-500">{formatDateTime(grant.updated_at)}</span>
              <span>
                {grant.status === "active" ? (
                  <form action={revokeAccessGrantAction.bind(null, grant.id)}>
                    <button className="inline-flex items-center gap-1 font-medium text-rose-700 hover:text-rose-900">
                      <Ban size={14} />
                      撤销
                    </button>
                  </form>
                ) : <span className="text-slate-400">已撤销</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>
      </AdminPageSurface>
    </AppShell>
  );
}
