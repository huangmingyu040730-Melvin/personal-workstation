import Link from "next/link";
import { AppShell } from "@/components/app-shell";
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

  return (
    <AppShell>
      <PageHeader
        eyebrow="Access Grants"
        title="创建访问授权"
        description="将单条 restricted 内容授权给指定邮箱。外部用户登录后只可查看被授权的内容详情。"
        action={<Link href="/dashboard/access-grants" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">返回授权列表</Link>}
      />
      <Card>
        <CardHeader title="授权信息" description="本表单不会创建外部密码，也不会通知用户；如需访问，请让对方使用 /viewer/login 的邮箱魔法链接登录。" />
        <AccessGrantForm
          options={options}
          error={getFormError(params)}
          initialEmail={getParam(params.email)}
          initialContentType={getParam(params.content_type)}
          requestId={getParam(params.request_id)}
        />
      </Card>
    </AppShell>
  );
}
