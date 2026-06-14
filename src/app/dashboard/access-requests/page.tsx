import Link from "next/link";
import { ArrowRight, Eye, Filter, Inbox } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getAccessRequestContextFromStoredUrl } from "@/lib/access-request-context";
import { accessRequestStatuses, getAccessRequestContentTypeLabel, getAccessRequestStatusLabel } from "@/lib/content-options";
import type { AccessRequestContentType, AccessRequestRecord, AccessRequestStatus } from "@/lib/content-types";
import { formatDateTime } from "@/lib/format";
import { getAccessRequests } from "@/lib/queries/access-requests";
import { cn } from "@/lib/utils";

type AccessRequestTypeFilter = "all" | AccessRequestContentType | "unknown";

const typeFilters: Array<{ value: AccessRequestTypeFilter; label: string }> = [
  { value: "all", label: "全部目标类型" },
  { value: "project", label: "研究项目" },
  { value: "publication", label: "学术成果" },
  { value: "knowledge", label: "知识文章" },
  { value: "skill", label: "Skill" },
  { value: "unknown", label: "未知 / 通用" }
];

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatus(value: string | undefined) {
  return accessRequestStatuses.some((item) => item.value === value) ? (value as AccessRequestStatus) : "all";
}

function normalizeType(value: string | undefined): AccessRequestTypeFilter {
  return typeFilters.some((item) => item.value === value) ? (value as AccessRequestTypeFilter) : "all";
}

function statusClass(status: AccessRequestStatus) {
  return cn(
    status === "pending" && "bg-amber-50 text-amber-700 ring-amber-100",
    status === "approved" && "bg-emerald-50 text-emerald-700 ring-emerald-100",
    status === "rejected" && "bg-rose-50 text-rose-700 ring-rose-100"
  );
}

function statusDescription(status: AccessRequestStatus) {
  if (status === "pending") {
    return "等待管理员人工判断。";
  }

  if (status === "approved") {
    return "只代表申请已同意，仍需单独创建 Access Grant。";
  }

  return "申请已拒绝，记录仍会保留。";
}

function isUnknownType(request: AccessRequestRecord) {
  return !request.requested_content_type || request.requested_content_type === "other";
}

function matchesType(request: AccessRequestRecord, type: AccessRequestTypeFilter) {
  if (type === "all") {
    return true;
  }

  if (type === "unknown") {
    return isUnknownType(request);
  }

  return request.requested_content_type === type;
}

function createFilterHref(status: string, type: string) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (type !== "all") {
    params.set("type", type);
  }

  const query = params.toString();
  return query ? `/dashboard/access-requests?${query}` : "/dashboard/access-requests";
}

function countByStatus(requests: AccessRequestRecord[], status: AccessRequestStatus) {
  return requests.filter((request) => request.status === status).length;
}

export default async function AccessRequestsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = normalizeStatus(getQueryValue(params.status));
  const type = normalizeType(getQueryValue(params.type));
  const allRequests = await getAccessRequests();
  const requests = allRequests.filter((request) => (status === "all" || request.status === status) && matchesType(request, type));
  const pendingCount = countByStatus(allRequests, "pending");
  const approvedCount = countByStatus(allRequests, "approved");
  const rejectedCount = countByStatus(allRequests, "rejected");
  const hasActiveFilter = status !== "all" || type !== "all";
  const emptyTitle = allRequests.length === 0
    ? "暂无访问申请"
    : status === "pending"
      ? "暂无待处理申请"
      : "没有符合筛选条件的申请";
  const emptyDescription = allRequests.length === 0
    ? "外部访客提交申请后会显示在这里。"
    : hasActiveFilter
      ? "当前筛选下没有访问申请，可以返回全部申请或调整筛选条件。"
      : "当前没有访问申请需要展示。";

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Requests"
          title="访问申请审核"
          description="按状态、目标类型和来源梳理访客申请；审批状态只记录人工处理结果，不自动创建授权。"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatusSummaryCard label="全部申请" value={allRequests.length} href="/dashboard/access-requests" active={status === "all"} />
          <StatusSummaryCard label="待处理" value={pendingCount} href={createFilterHref("pending", type)} active={status === "pending"} tone="amber" />
          <StatusSummaryCard label="已同意" value={approvedCount} href={createFilterHref("approved", type)} active={status === "approved"} tone="emerald" />
          <StatusSummaryCard label="已拒绝" value={rejectedCount} href={createFilterHref("rejected", type)} active={status === "rejected"} tone="rose" />
        </div>

        <Card className="border-blue-100 bg-blue-50/60">
          <div className="flex gap-3 text-sm leading-7 text-blue-800">
            <Inbox className="mt-1 shrink-0" size={18} />
            <p>
              访问申请只是访客意向，不是权限授权。标记 approved 后仍需管理员手动创建 Access Grant，并手动选择具体 restricted 内容；不会自动发邮件、开放 Documents 或生成 signed URL。
            </p>
          </div>
        </Card>

        <AdminSection
          title="筛选申请"
          description="先处理 pending，再按目标类型和来源核对申请上下文。"
          action={<Badge className="bg-slate-100 text-slate-600 ring-slate-200">{requests.length} 条结果</Badge>}
        >
          <form className="grid gap-3 md:grid-cols-[220px_220px_auto_1fr] md:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">处理状态</span>
              <select name="status" defaultValue={status} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                <option value="all">全部状态</option>
                {accessRequestStatuses.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">目标类型</span>
              <select name="type" defaultValue={type} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                {typeFilters.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-navy-800">
              <Filter size={16} />
              应用筛选
            </button>
            {hasActiveFilter ? (
              <Link href="/dashboard/access-requests" className="inline-flex h-11 items-center text-sm font-semibold text-blue-700 hover:text-blue-900">
                返回全部申请
              </Link>
            ) : null}
          </form>
        </AdminSection>

        {requests.length === 0 ? (
          <AdminEmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={hasActiveFilter ? (
              <Link href="/dashboard/access-requests" className="inline-flex rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
                查看全部申请
              </Link>
            ) : null}
          />
        ) : (
          <section className="space-y-4">
            {requests.map((request) => {
              const context = getAccessRequestContextFromStoredUrl(request.requested_content_url);

              return (
                <Card key={request.id} className="transition hover:-translate-y-0.5 hover:border-blue-200">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass(request.status)}>{getAccessRequestStatusLabel(request.status)}</Badge>
                        <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{getAccessRequestContentTypeLabel(request.requested_content_type)}</Badge>
                        <span className="text-xs text-slate-500">{statusDescription(request.status)}</span>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-slate-950">{request.requested_content_title ?? "未指定申请目标"}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {request.requester_name} · {request.requester_email}
                      </p>
                    </div>
                    <Link href={`/dashboard/access-requests/${request.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                      <Eye size={15} />
                      进入详情
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="机构 / 身份" value={request.organization ?? "未填写"} />
                    <InfoTile label="slug" value={context.slug ?? "未提供"} />
                    <InfoTile label="来源页面" value={context.sourceLabel} />
                    <InfoTile label="创建时间" value={formatDateTime(request.created_at)} />
                    <InfoTile label="公开路径" value={context.publicPath ?? "未提供"} />
                    <InfoTile label="更新时间" value={formatDateTime(request.updated_at)} />
                    <InfoTile label="处理时间" value={request.reviewed_at ? formatDateTime(request.reviewed_at) : "未处理"} />
                    <InfoTile label="备注状态" value={request.admin_note ? "已有内部备注" : "暂无内部备注"} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">申请理由摘要</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">{request.reason}</p>
                  </div>
                </Card>
              );
            })}
          </section>
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function StatusSummaryCard({
  label,
  value,
  href,
  active,
  tone = "blue"
}: {
  label: string;
  value: number;
  href: string;
  active: boolean;
  tone?: "blue" | "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    blue: active ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-900",
    amber: active ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-900",
    emerald: active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-900",
    rose: active ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-900"
  }[tone];

  return (
    <Link href={href} className={`rounded-3xl border p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
