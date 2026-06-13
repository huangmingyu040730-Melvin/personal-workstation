import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { AccessRequestForm } from "@/components/forms/access-request-form";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { getFormError } from "@/lib/forms";

export const metadata: Metadata = {
  title: "申请查看受限内容",
  description: "提交访问申请，用于申请查看黄铭语公开研究工作站中未公开或受限的研究内容。"
};

export default async function AccessRequestPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const success = params.success === "1";

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Access Request"
        title="申请查看受限内容"
        description="公开内容可以直接浏览；如果希望查看未公开或受限内容，可以提交访问申请。提交申请不代表一定会授权。"
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <Card>
          <CardHeader title="申请说明" />
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p className="flex gap-2">
              <ShieldCheck className="mt-1 shrink-0 text-blue-700" size={18} />
              当前网站公开内容可以直接浏览，私密文件、后台记录和未公开材料不会出现在公开页面。
            </p>
            <p>如果你希望查看某个未公开研究项目、成果、Skill、知识文章或未来受限材料，可以在右侧提交申请。</p>
            <p>请不要在申请理由中填写敏感个人隐私、机密资料、账号信息或不适合公开系统保存的内容。</p>
            <p className="rounded-2xl bg-slate-50 p-4 text-slate-700">申请通过后，管理员可以为指定邮箱创建单条内容授权；授权不包含后台、内部附件库或附件下载。</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="访问申请表单" description="请填写必要信息，便于后续判断申请内容与用途。" />
          <AccessRequestForm error={getFormError(params)} success={success} />
        </Card>
      </section>
    </PublicShell>
  );
}
