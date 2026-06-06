import Link from "next/link";
import { Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        eyebrow="Access Requests"
        title="访问申请"
        description="查看外部访客提交的受限内容访问申请，记录审批状态，并为已同意申请创建授权。"
      />
      <Card className="mb-5 border-blue-100 bg-blue-50/60">
        <p className="text-sm leading-7 text-blue-800">审批状态不会自动开放访问；请在申请详情中为 approved 申请创建具体内容授权。</p>
      </Card>
      <form className="mb-5 flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
          <option value="all">全部状态</option>
          {accessRequestStatuses.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:text-blue-700">筛选</button>
      </form>
      <Card className="overflow-x-auto p-0">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[0.65fr_0.9fr_0.75fr_0.55fr_1fr_0.5fr_0.7fr_0.7fr_0.35fr] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500">
            <span>姓名</span>
            <span>邮箱</span>
            <span>机构 / 身份</span>
            <span>类型</span>
            <span>内容标题</span>
            <span>状态</span>
            <span>创建时间</span>
            <span>处理时间</span>
            <span>操作</span>
          </div>
          {requests.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">暂无访问申请。</div>
          ) : requests.map((request) => (
            <div key={request.id} className="grid grid-cols-[0.65fr_0.9fr_0.75fr_0.55fr_1fr_0.5fr_0.7fr_0.7fr_0.35fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0">
              <span className="font-medium text-slate-900">{request.requester_name}</span>
              <span className="truncate text-slate-600">{request.requester_email}</span>
              <span className="truncate text-slate-500">{request.organization ?? "未填写"}</span>
              <span className="text-slate-500">{getAccessRequestContentTypeLabel(request.requested_content_type)}</span>
              <span className="truncate text-slate-600">{request.requested_content_title ?? "未指定"}</span>
              <span><span className={statusClass(request.status)}>{getAccessRequestStatusLabel(request.status)}</span></span>
              <span className="text-slate-500">{formatDateTime(request.created_at)}</span>
              <span className="text-slate-500">{request.reviewed_at ? formatDateTime(request.reviewed_at) : "未处理"}</span>
              <Link href={`/dashboard/access-requests/${request.id}`} className="inline-flex items-center gap-1 font-medium text-blue-700">
                <Eye size={14} />
                查看
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
