import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
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
        <AdminFormSurface>
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
