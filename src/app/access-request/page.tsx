import type { Metadata } from "next";
import { FileText, LockKeyhole, Route, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { AccessRequestForm } from "@/components/forms/access-request-form";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { getAccessRequestContentTypeLabel } from "@/lib/content-options";
import { buildAccessRequestHref, getAccessRequestContextFromSearchParams } from "@/lib/access-request-context";
import { getFormError } from "@/lib/forms";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "申请访问",
  description: "申请查看未公开研究资料、受限内容或进一步材料。",
  path: "/access-request"
});

export default async function AccessRequestPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const success = params.success === "1";
  const context = getAccessRequestContextFromSearchParams(params);
  const returnTo = buildAccessRequestHref({
    contentType: context.contentType,
    slug: context.slug,
    title: context.title,
    from: context.from
  });

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Access Request"
        title="申请访问研究资料"
        description="用于申请查看未公开报告、研究材料、项目细节或需要授权的内容。申请会进入人工审核，不会自动开放访问权限。"
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="space-y-5">
          <Card>
            <CardHeader title={context.hasContext ? "申请上下文" : "申请入口"} description={context.hasContext ? "你从公开内容页进入申请流程，下面是随链接带来的公开上下文。" : "也可以独立提交申请，并在表单中描述希望查看的材料。"} />
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-blue-900">
                <Route className="mt-0.5 shrink-0 text-blue-700" size={18} />
                <div>
                  <p className="font-semibold">{context.title ?? "未指定具体标题"}</p>
                  <p className="mt-1 leading-6 text-blue-800">
                    {context.contentType ? getAccessRequestContentTypeLabel(context.contentType) : "未指定内容类型"}
                    {context.slug ? ` · ${context.slug}` : ""}
                  </p>
                  <p className="mt-1 leading-6 text-blue-800">来源：{context.sourceLabel}</p>
                </div>
              </div>
              <p className="leading-7 text-slate-600">
                上下文只用于帮助管理员理解申请目标；表单不会读取或展示 private / restricted 正文、附件、内部关系或文件内部信息。
              </p>
            </div>
          </Card>
          <Card>
            <CardHeader title="审核边界" />
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p className="flex gap-2">
                <ShieldCheck className="mt-1 shrink-0 text-blue-700" size={18} />
                申请提交后只会生成一条待处理记录，不会自动获得查看权限。
              </p>
              <p className="flex gap-2">
                <LockKeyhole className="mt-1 shrink-0 text-blue-700" size={18} />
                私密文件、内部文件地址、临时访问地址、后台记录和内部关系不会通过申请表单直接公开。
              </p>
              <p className="flex gap-2">
                <FileText className="mt-1 shrink-0 text-blue-700" size={18} />
                请在申请理由中说明研究用途，不要填写密码、API key、授权码、私密通信原文或其他敏感信息。
              </p>
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader title="访问申请表单" description="请填写必要信息，便于后续判断申请目标、用途和是否需要创建单条访问授权。" />
          <AccessRequestForm
            error={getFormError(params)}
            success={success}
            returnTo={returnTo}
            initialValues={{
              requested_content_type: context.contentType,
              requested_content_title: context.title,
              requested_content_url: context.requestedContentUrl
            }}
          />
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-600">
          访问申请和访问授权是两个步骤。管理员审核后，才可能通过既有 Access Grants 为指定邮箱开放单条 restricted 内容；本流程不新增邮件服务，不自动开放 Documents，也不改变公开附件下载规则。
        </div>
      </section>
    </PublicShell>
  );
}
