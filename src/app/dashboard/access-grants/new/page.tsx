import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
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

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Access Grants"
          title="创建访问授权"
          description="将单条 restricted 内容授权给指定邮箱。外部用户登录后只可查看被授权的内容详情。"
          action={<Link href="/dashboard/access-grants" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">返回授权列表</Link>}
        />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="授权创建规则"
                description="授权只绑定到指定邮箱和单条 restricted 内容，不开放后台。"
                items={["普通访客不能读取授权列表。", "管理员可随时撤销授权。", "过期时间可选，留空表示长期有效。"]}
              />
              <AdminFormHelpCard
                title="已知限制"
                tone="slate"
                items={["Viewer magic link 登录仍冻结为单独 hotfix。", "本轮不修改 RLS 或 Auth。", "Documents 与附件不会被授权开放。"]}
              />
            </>
          }
        >
          <AdminSecurityNote>本表单不会创建外部密码，也不会通知用户；Viewer magic link 登录仍作为已知问题单独跟进，本轮只优化后台界面。</AdminSecurityNote>
          <AccessGrantForm
            options={options}
            error={getFormError(params)}
            initialEmail={getParam(params.email)}
            initialContentType={getParam(params.content_type)}
            requestId={getParam(params.request_id)}
          />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
