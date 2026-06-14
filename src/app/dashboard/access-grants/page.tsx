import Link from "next/link";
import { ArrowRight, Ban, Eye, Filter, KeyRound, Plus } from "lucide-react";
import { revokeAccessGrantAction } from "@/actions/access-grants";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { accessGrantContentTypes, getAccessGrantContentTypeLabel, getAccessGrantStatusLabel } from "@/lib/content-options";
import type { AccessGrantContentType, ContentAccessGrantWithTarget } from "@/lib/content-types";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getAccessGrantEffectiveStatus, getAccessGrants, type AccessGrantEffectiveStatus } from "@/lib/queries/access-grants";
import { cn, visibilityLabel } from "@/lib/utils";

type AccessGrantStatusFilter = "all" | AccessGrantEffectiveStatus;
type AccessGrantTypeFilter = "all" | AccessGrantContentType;

const statusFilters: Array<{ value: AccessGrantStatusFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "有效" },
  { value: "expired", label: "已过期" },
  { value: "revoked", label: "已撤销" }
];

const typeFilters: Array<{ value: AccessGrantTypeFilter; label: string }> = [
  { value: "all", label: "全部内容类型" },
  ...accessGrantContentTypes
];

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatus(value: string | undefined): AccessGrantStatusFilter {
  return statusFilters.some((item) => item.value === value) ? (value as AccessGrantStatusFilter) : "all";
}

function normalizeType(value: string | undefined): AccessGrantTypeFilter {
  return typeFilters.some((item) => item.value === value) ? (value as AccessGrantTypeFilter) : "all";
}

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
    return "当前可用于 restricted 内容访问。";
  }

  if (status === "expired") {
    return "已超过有效期，不再授予访问。";
  }

  return "已撤销，不再授予访问。";
}

function createFilterHref(status: AccessGrantStatusFilter, type: AccessGrantTypeFilter) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (type !== "all") {
    params.set("content_type", type);
  }

  const query = params.toString();
  return query ? `/dashboard/access-grants?${query}` : "/dashboard/access-grants";
}

function matchesType(grant: ContentAccessGrantWithTarget, type: AccessGrantTypeFilter) {
  return type === "all" || grant.content_type === type;
}

function countByStatus(grants: ContentAccessGrantWithTarget[], status: AccessGrantEffectiveStatus) {
  return grants.filter((grant) => getAccessGrantEffectiveStatus(grant) === status).length;
}

export default async function AccessGrantsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = normalizeStatus(getQueryValue(params.status));
  const contentType = normalizeType(getQueryValue(params.content_type));
  const allGrants = await getAccessGrants();
  const grants = allGrants.filter((grant) => {
    const effectiveStatus = getAccessGrantEffectiveStatus(grant);
    return (status === "all" || effectiveStatus === status) && matchesType(grant, contentType);
  });
  const error = getFormError(params);
  const activeCount = countByStatus(allGrants, "active");
  const expiredCount = countByStatus(allGrants, "expired");
  const revokedCount = countByStatus(allGrants, "revoked");
  const hasActiveFilter = status !== "all" || contentType !== "all";
  const emptyTitle = allGrants.length === 0
    ? "暂无访问授权"
    : "当前筛选无结果";
  const emptyDescription = allGrants.length === 0
    ? "创建授权后，指定邮箱才具备对应 restricted 内容的只读访问条件。"
    : "当前筛选下没有授权记录，可以返回全部授权或调整筛选条件。";

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Grants"
          title="访问授权管理"
          description="管理 restricted 内容的邮箱级授权；Access Grant 才是真正授权记录，Access Request 只是申请处理记录。"
          action={
            <Link href="/dashboard/access-grants/new" className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
              <Plus size={16} />
              新建授权
            </Link>
          }
        />

        {error ? <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</Card> : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatusSummaryCard label="全部授权" value={allGrants.length} href="/dashboard/access-grants" active={status === "all"} />
          <StatusSummaryCard label="有效" value={activeCount} href={createFilterHref("active", contentType)} active={status === "active"} tone="emerald" />
          <StatusSummaryCard label="已过期" value={expiredCount} href={createFilterHref("expired", contentType)} active={status === "expired"} tone="amber" />
          <StatusSummaryCard label="已撤销" value={revokedCount} href={createFilterHref("revoked", contentType)} active={status === "revoked"} tone="slate" />
        </div>

        <AdminSecurityNote>
          Access Grant 只授权指定邮箱查看单条 restricted 内容，不开放 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL，也不会改变内容 visibility 或 public attachments 下载规则。
        </AdminSecurityNote>

        <AdminSection
          title="筛选授权"
          description="先确认授权状态，再按内容类型定位 Project / Publication / Knowledge / Skill。"
          action={<Badge className="bg-slate-100 text-slate-600 ring-slate-200">{grants.length} 条结果</Badge>}
        >
          <form className="grid gap-3 md:grid-cols-[220px_220px_auto_1fr] md:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">授权状态</span>
              <select name="status" defaultValue={status} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                {statusFilters.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">内容类型</span>
              <select name="content_type" defaultValue={contentType} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
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
              <Link href="/dashboard/access-grants" className="inline-flex h-11 items-center text-sm font-semibold text-blue-700 hover:text-blue-900">
                返回全部授权
              </Link>
            ) : null}
          </form>
        </AdminSection>

        {grants.length === 0 ? (
          <AdminEmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                {hasActiveFilter ? (
                  <Link href="/dashboard/access-grants" className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                    查看全部授权
                  </Link>
                ) : null}
                <Link href="/dashboard/access-grants/new" className="inline-flex rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
                  创建 Access Grant
                </Link>
              </div>
            }
          />
        ) : (
          <section className="space-y-4">
            {grants.map((grant) => {
              const effectiveStatus = getAccessGrantEffectiveStatus(grant);

              return (
                <Card key={grant.id} className="transition hover:-translate-y-0.5 hover:border-blue-200">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass(effectiveStatus)}>{statusLabel(effectiveStatus)}</Badge>
                        <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{getAccessGrantContentTypeLabel(grant.content_type)}</Badge>
                        <span className="text-xs text-slate-500">{statusDescription(effectiveStatus)}</span>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-slate-950">
                        {grant.target ? grant.target.title : "内容不存在或当前不可读取"}
                      </h2>
                      <p className="mt-1 break-all text-sm text-slate-500">{grant.grantee_email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {grant.target ? (
                        <Link href={grant.target.adminHref} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                          <KeyRound size={15} />
                          内容后台
                        </Link>
                      ) : null}
                      <Link href={`/dashboard/access-grants/${grant.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                        <Eye size={15} />
                        查看详情
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="内容 slug" value={grant.target?.slug ?? "无法显示"} />
                    <InfoTile label="内容 visibility" value={grant.target ? visibilityLabel(grant.target.visibility) : "未知"} />
                    <InfoTile label="创建时间" value={formatDateTime(grant.created_at)} />
                    <InfoTile label="过期时间" value={grant.expires_at ? formatDateTime(grant.expires_at) : "长期有效"} />
                    <InfoTile label="撤销时间" value={grant.status === "revoked" ? formatDateTime(grant.updated_at) : "未撤销"} />
                    <InfoTile label="更新时间" value={formatDateTime(grant.updated_at)} />
                    <InfoTile label="来源申请" value="当前 schema 未记录" />
                    <InfoTile label="备注状态" value={grant.admin_note ? "已有内部备注" : "暂无内部备注"} />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm leading-6 text-slate-600">
                      撤销只会取消 restricted 内容访问条件，不删除申请、不删除内容、不修改 visibility，也不影响公开页面或公开附件下载规则。
                    </p>
                    {grant.status === "active" ? (
                      <form action={revokeAccessGrantAction.bind(null, grant.id)}>
                        <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:border-rose-300 hover:text-rose-900">
                          <Ban size={15} />
                          撤销授权
                        </button>
                      </form>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">无需操作</span>
                    )}
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
  tone?: "blue" | "emerald" | "amber" | "slate";
}) {
  const toneClass = {
    blue: active ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-900",
    emerald: active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-900",
    amber: active ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-900",
    slate: active ? "border-slate-300 bg-slate-100 text-slate-900" : "border-slate-200 bg-white text-slate-900"
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
    <div className="min-w-0 rounded-2xl bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
