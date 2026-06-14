import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { Card, CardHeader } from "@/components/card";
import { AccessGrantForm } from "@/components/forms/access-grant-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getGrantContentOptions } from "@/lib/queries/access-grants";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewAccessGrantPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, options] = await Promise.all([searchParams, getGrantContentOptions()]);
  const requestId = getParam(params.request_id);
  const initialEmail = getParam(params.email);
  const initialContentType = getParam(params.content_type);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Grants"
          title="创建访问授权"
          description="将单条 restricted 内容授权给指定邮箱；申请上下文只能辅助判断，不能自动选择具体内容。"
          action={
            <Link href="/dashboard/access-grants" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回授权列表
            </Link>
          }
        />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="授权创建规则"
                description="授权只绑定到指定邮箱和单条 restricted 内容，不开放后台或附件。"
                items={["必须手动选择具体 restricted 内容。", "授权不会改变内容 visibility。", "过期时间可选，留空表示长期有效。"]}
              />
              <AdminFormHelpCard
                title="边界"
                tone="slate"
                items={["不会开放 Documents、private attachments 或 zip。", "不会生成 signed URL。", "不会影响 public attachments 下载规则。"]}
              />
            </>
          }
        >
          {requestId ? (
            <Card className="border-blue-100 bg-blue-50/70">
              <CardHeader title="来自访问申请的上下文" description="这些 query 只帮助你定位申请，不是自动授权依据。" />
              <dl className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <dt className="text-blue-700">申请 ID</dt>
                  <dd className="mt-1 break-all font-semibold text-blue-950">{requestId}</dd>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <dt className="text-blue-700">预填邮箱</dt>
                  <dd className="mt-1 break-all font-semibold text-blue-950">{initialEmail ?? "未提供"}</dd>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <dt className="text-blue-700">预填类型</dt>
                  <dd className="mt-1 font-semibold text-blue-950">{initialContentType ?? "未提供"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-blue-800">
                当前申请 ID 只作为创建时的人工核对线索，不会自动绑定为授权来源。请手动选择具体 restricted 内容，不要把 slug 或申请目标当作 private id。
              </p>
            </Card>
          ) : null}
          <AdminSecurityNote>本表单不会创建外部密码、不会发送邮件、不会自动授权申请目标，也不会开放 Documents、Storage path、Storage bucket 或 signed URL。</AdminSecurityNote>
          <AccessGrantForm
            options={options}
            error={getFormError(params)}
            initialEmail={initialEmail}
            initialContentType={initialContentType}
            requestId={requestId}
          />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
