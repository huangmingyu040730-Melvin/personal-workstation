import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { AccessRequestReviewForm } from "@/components/forms/access-request-review-form";
import { PageHeader } from "@/components/page-header";
import { getAccessRequestContentTypeLabel, getAccessRequestStatusLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getAccessRequestById } from "@/lib/queries/access-requests";

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

  return (
    <AppShell>
      <PageHeader
        eyebrow="Access Request"
        title={`${request.requester_name} 的访问申请`}
        description="当前审批仅用于记录处理状态，不会自动开放受限内容访问。"
        action={<Link href="/dashboard/access-requests" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">返回列表</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="申请信息" />
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">姓名</dt><dd className="mt-1 font-medium text-slate-900">{request.requester_name}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">邮箱</dt><dd className="mt-1 break-all font-medium text-slate-900">{request.requester_email}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">机构 / 身份</dt><dd className="mt-1 font-medium text-slate-900">{request.organization ?? "未填写"}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">状态</dt><dd className="mt-1 font-medium text-slate-900">{getAccessRequestStatusLabel(request.status)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">创建时间</dt><dd className="mt-1 font-medium text-slate-900">{formatDateTime(request.created_at)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">处理时间</dt><dd className="mt-1 font-medium text-slate-900">{request.reviewed_at ? formatDateTime(request.reviewed_at) : "未处理"}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="申请内容" />
            <dl className="space-y-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">内容类型</dt><dd className="mt-1 font-medium text-slate-900">{getAccessRequestContentTypeLabel(request.requested_content_type)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">内容标题</dt><dd className="mt-1 font-medium text-slate-900">{request.requested_content_title ?? "未指定"}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">内容链接</dt><dd className="mt-1 break-all font-medium text-slate-900">{request.requested_content_url ?? "未填写"}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">申请理由</dt><dd className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{request.reason}</dd></div>
            </dl>
          </Card>
        </div>
        <Card>
          <CardHeader title="处理申请" description="本阶段只记录审批状态和内部备注。" />
          <AccessRequestReviewForm request={request} error={getFormError(query)} />
        </Card>
      </div>
    </AppShell>
  );
}
