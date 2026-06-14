import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { AccessRequestReviewForm } from "@/components/forms/access-request-review-form";
import { PageHeader } from "@/components/page-header";
import { getAccessRequestContextFromStoredUrl } from "@/lib/access-request-context";
import { getAccessRequestContentTypeLabel, getAccessRequestStatusLabel } from "@/lib/content-options";
import type { AccessRequestRecord, AccessRequestStatus } from "@/lib/content-types";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getAccessRequestById } from "@/lib/queries/access-requests";
import { cn } from "@/lib/utils";

const grantableContentTypes = ["project", "publication", "knowledge", "skill"];

function statusClass(status: AccessRequestStatus) {
  return cn(
    status === "pending" && "bg-amber-50 text-amber-700 ring-amber-100",
    status === "approved" && "bg-emerald-50 text-emerald-700 ring-emerald-100",
    status === "rejected" && "bg-rose-50 text-rose-700 ring-rose-100"
  );
}

function statusDescription(status: AccessRequestStatus) {
  if (status === "pending") {
    return "等待管理员人工审核；此状态不会开放任何内容。";
  }

  if (status === "approved") {
    return "申请已同意，但这只是处理状态，不是访问授权。";
  }

  return "申请已拒绝；记录保留用于后台追踪。";
}

function buildAccessGrantHref(request: AccessRequestRecord) {
  const params = new URLSearchParams({
    email: request.requester_email,
    request_id: request.id
  });

  if (request.requested_content_type && grantableContentTypes.includes(request.requested_content_type)) {
    params.set("content_type", request.requested_content_type);
  }

  return `/dashboard/access-grants/new?${params.toString()}`;
}

export default async function AccessRequestDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const request = await getAccessRequestById(id);

  if (!request) {
    notFound();
  }
  const requestContext = getAccessRequestContextFromStoredUrl(request.requested_content_url);
  const accessGrantHref = buildAccessGrantHref(request);
  const formError = getFormError(query);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Request"
          title="访问申请审核工作台"
          description={`${request.requester_name} 提交的访问申请。请人工核对目标、来源、理由和联系方式后再记录处理状态。`}
          action={
            <Link href="/dashboard/access-requests" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回列表
            </Link>
          }
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(request.status)}>{getAccessRequestStatusLabel(request.status)}</Badge>
                <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{getAccessRequestContentTypeLabel(request.requested_content_type)}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{request.requested_content_title ?? "未指定申请目标"}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{statusDescription(request.status)}</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <span className="rounded-2xl bg-slate-50 px-3 py-2">提交：{formatDateTime(request.created_at)}</span>
              <span className="rounded-2xl bg-slate-50 px-3 py-2">更新：{formatDateTime(request.updated_at)}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="min-w-0 space-y-5">
            <Card>
              <CardHeader title="申请人信息" description="用于人工联系、判断申请背景和后续授权邮箱。" />
              <dl className="grid gap-3 text-sm md:grid-cols-3">
                <InfoBlock label="姓名" value={request.requester_name} />
                <InfoBlock label="邮箱" value={request.requester_email} allowBreak />
                <InfoBlock label="机构 / 身份" value={request.organization ?? "未填写"} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="申请目标与来源" description="只使用访客提交的公开上下文；不要把 private id 当作授权依据。" />
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <InfoBlock label="内容类型" value={getAccessRequestContentTypeLabel(request.requested_content_type)} />
                <InfoBlock label="目标标题" value={request.requested_content_title ?? "未指定"} />
                <InfoBlock label="slug" value={requestContext.slug ?? "未提供"} />
                <InfoBlock label="来源页面" value={requestContext.sourceLabel} />
                <InfoBlock label="公开路径" value={requestContext.publicPath ?? "未填写"} allowBreak />
                <InfoBlock label="原始申请链接" value={request.requested_content_url ?? "未填写"} allowBreak />
              </dl>
            </Card>

            <Card>
              <CardHeader title="申请理由" description="完整保留访客提交的用途说明，处理前请人工复核是否包含敏感信息。" />
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                <p className="whitespace-pre-wrap">{request.reason}</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="当前处理记录" description="处理状态与内部备注只用于后台人工审核记录。" />
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <InfoBlock label="当前状态" value={getAccessRequestStatusLabel(request.status)} />
                <InfoBlock label="处理时间" value={request.reviewed_at ? formatDateTime(request.reviewed_at) : "未处理"} />
                <InfoBlock label="更新时间" value={formatDateTime(request.updated_at)} />
                <InfoBlock label="备注状态" value={request.admin_note ? "已有内部备注" : "暂无内部备注"} />
              </dl>
              {request.admin_note ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">内部备注</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.admin_note}</p>
                </div>
              ) : null}
            </Card>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardHeader
                title="人工处理区"
                description="只记录处理状态和内部备注，不触发任何自动授权或通知。"
              />
              <AccessRequestReviewForm request={request} error={formError} />
            </Card>

            <Card className={request.status === "approved" ? "border-blue-100 bg-blue-50/70" : ""}>
              <CardHeader title="Access Grant 引导" description="授权 restricted 内容必须单独创建，并手动选择具体内容。" />
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>approved 只代表申请处理状态，不代表外部用户已经获得访问权限。</p>
                <p>创建授权时只会预填申请邮箱和内容类型；不会自动选择 private id，也不会自动创建授权。</p>
              </div>
              {request.status === "approved" ? (
                <Link
                  href={accessGrantHref}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  手动创建 Access Grant
                  <ExternalLink size={15} />
                </Link>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  如需授权，建议先完成人工审核并将状态标记为“已同意”，再创建 Access Grant。
                </div>
              )}
            </Card>

            <Card className="border-blue-100 bg-blue-50/60">
              <CardHeader title="安全边界" />
              <div className="space-y-3 text-sm leading-6 text-blue-800">
                <BoundaryItem>不会自动发送邮件或通知。</BoundaryItem>
                <BoundaryItem>不会自动开放 restricted/private 正文。</BoundaryItem>
                <BoundaryItem>不会开放 Documents、private attachments、zip、Storage path、Storage bucket 或 signed URL。</BoundaryItem>
                <BoundaryItem>public attachments 仍只通过 `/public-files/[id]/download` 服务端校验下载。</BoundaryItem>
              </div>
            </Card>
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
