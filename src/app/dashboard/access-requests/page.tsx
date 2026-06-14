import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getAccessRequestContextFromStoredUrl } from "@/lib/access-request-context";
import { accessRequestStatuses, getAccessRequestContentTypeLabel, getAccessRequestStatusLabel } from "@/lib/content-options";
import type { AccessRequestStatus } from "@/lib/content-types";
import { formatDateTime } from "@/lib/format";
import { getAccessRequests } from "@/lib/queries/access-requests";
import { cn } from "@/lib/utils";

function statusClass(status: AccessRequestStatus) {
  return cn(
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
    status === "pending" && "bg-amber-50 text-amber-700",
    status === "approved" && "bg-emerald-50 text-emerald-700",
    status === "rejected" && "bg-rose-50 text-rose-700"
  );
}

export default async function AccessRequestsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const requests = await getAccessRequests({ status });

  return (
    <AppShell>
      <AdminPageSurface>
      <PageHeader
        eyebrow="Access Requests"
        title="访问申请"
        description="查看外部访客提交的受限内容访问申请，记录审批状态，并为已同意申请创建授权。"
      />
      <Card className="mb-5 border-blue-100 bg-blue-50/60">
        <p className="text-sm leading-7 text-blue-800">审批状态不会自动开放访问；请在申请详情中为 approved 申请创建具体内容授权。</p>
      </Card>
      <AdminSection>
      <form className="flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部状态</option>
          {accessRequestStatuses.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
      </form>
      </AdminSection>
      <Card className="overflow-x-auto p-0">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[0.8fr_1fr_1.35fr_0.85fr_1.3fr_0.6fr_0.75fr_0.4fr] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500">
            <span>申请人</span>
            <span>邮箱</span>
            <span>申请目标</span>
            <span>来源</span>
            <span>申请理由</span>
            <span>状态</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          {requests.length === 0 ? (
            <div className="p-5"><AdminEmptyState title="暂无访问申请" description="外部访客提交申请后会显示在这里。" /></div>
          ) : requests.map((request) => {
            const context = getAccessRequestContextFromStoredUrl(request.requested_content_url);

            return (
              <div key={request.id} className="grid grid-cols-[0.8fr_1fr_1.35fr_0.85fr_1.3fr_0.6fr_0.75fr_0.4fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-blue-50/60 last:border-0">
                <span>
                  <span className="block font-medium text-slate-900">{request.requester_name}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{request.organization ?? "未填写机构"}</span>
                </span>
                <span className="truncate text-slate-600">{request.requester_email}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-800">{request.requested_content_title ?? "未指定标题"}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {getAccessRequestContentTypeLabel(request.requested_content_type)}
                    {context.slug ? ` · ${context.slug}` : ""}
                  </span>
                </span>
                <span className="truncate text-slate-500">{context.sourceLabel}</span>
                <span className="line-clamp-2 text-slate-600">{request.reason}</span>
                <span><span className={statusClass(request.status)}>{getAccessRequestStatusLabel(request.status)}</span></span>
                <span className="text-slate-500">{formatDateTime(request.created_at)}</span>
                <Link href={`/dashboard/access-requests/${request.id}`} className="inline-flex items-center gap-1 font-medium text-blue-700">
                  <Eye size={14} />
                  查看
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
      </AdminPageSurface>
    </AppShell>
  );
}
