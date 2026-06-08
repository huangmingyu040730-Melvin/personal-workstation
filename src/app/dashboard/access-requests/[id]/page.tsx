import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSection } from "@/components/admin-ui";
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
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Request"
          title={`${request.requester_name} 的访问申请`}
          description="审批用于记录处理状态；如需开放 restricted 内容，请基于申请创建访问授权。"
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
        <AdminSection title="处理申请" description="保存审批状态后，可为已同意申请创建具体内容授权。">
          <div className="space-y-5">
            <AccessRequestReviewForm request={request} error={getFormError(query)} />
            {request.status === "approved" ? (
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">创建访问授权</p>
                <p className="mt-2 text-sm leading-6 text-blue-800">授权会绑定到指定邮箱和单条内容。外部用户仍不能进入后台，也不能访问附件。</p>
                <Link
                  href={`/dashboard/access-grants/new?email=${encodeURIComponent(request.requester_email)}&content_type=${encodeURIComponent(request.requested_content_type ?? "")}&request_id=${request.id}`}
                  className="mt-4 inline-flex rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  基于此申请创建授权
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">申请标记为“已同意”后，可以基于申请邮箱创建 restricted 内容授权。</div>
            )}
          </div>
        </AdminSection>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
