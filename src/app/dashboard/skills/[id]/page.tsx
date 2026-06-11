import Link from "next/link";
import { notFound } from "next/navigation";
import { createSkillVersionAction, deleteSkillAction } from "@/actions/skills";
import { AppShell } from "@/components/app-shell";
import { AdminFormSection, AdminPageSurface } from "@/components/admin-ui";
import { StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { Field, Textarea, TextInput } from "@/components/forms/form-fields";
import { DeleteButton, SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { RelatedDocumentsPanel } from "@/components/related-documents-panel";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getSkillById, getSkillVersions } from "@/lib/queries/skills";

export default async function SkillDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [skill, versions] = await Promise.all([getSkillById(id), getSkillVersions(id)]);

  if (!skill) {
    notFound();
  }

  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow={skill.category}
          title={skill.name}
          description={skill.description}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/skills/${skill.id}/edit`} className="rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">编辑</Link>
              <form action={deleteSkillAction.bind(null, skill.id)}>
                <DeleteButton label="删除 Skill" />
              </form>
            </div>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            空文档包已删除。
          </div>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-[1fr_0.4fr]">
        <div className="space-y-5">
          <Card><CardHeader title="详细说明" /><MarkdownPreview content={skill.content} /></Card>
          <Card><CardHeader title="输入内容说明" /><MarkdownPreview content={skill.input_description} emptyText="尚未填写输入说明。" /></Card>
          <Card><CardHeader title="输出内容说明" /><MarkdownPreview content={skill.output_description} emptyText="尚未填写输出说明。" /></Card>
          <Card><CardHeader title="使用指南" /><MarkdownPreview content={skill.usage_guide} emptyText="尚未填写使用指南。" /></Card>
          <Card><CardHeader title="SKILL.md" /><MarkdownPreview content={skill.skill_md_content} emptyText="尚未填写 SKILL.md 内容。" /></Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="状态" action={<VisibilityBadge visibility={skill.visibility} />} />
            <div className="flex items-center justify-between">
              <StatusBadge status={skill.status} />
              <span className="text-sm font-semibold text-slate-800">{skill.current_version ?? "未设版本"}</span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">slug</dt><dd className="font-medium text-slate-800">{skill.slug}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{skill.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(skill.updated_at)}</dd></div>
            </dl>
            {skill.repository_url ? <Link href={skill.repository_url} className="mt-5 block text-sm font-medium text-blue-700">打开 GitHub 仓库</Link> : null}
          </Card>
          <RelatedDocumentsPanel
            relatedType="skill"
            relatedId={skill.id}
            title="Skill 包 / 文档包"
            description="Skill 相关附件只作为私密文件保存，不会同步到任何外部环境。"
            uploadFileLabel="上传文档"
            uploadBatchLabel="上传 Skill 包"
            uploadFileCategory="skill_attachment"
            uploadBatchCategory="skill_attachment"
            uploadBatchCollectionType="skill_package"
            emptyText="还没有关联 Skill 文件。可以上传说明文档、zip 包或文件夹作为私密附件。"
            securityNote="Skill 包只作为私密文件存储。不执行、不解析、不安装上传代码，也不会自动同步到任何外部环境。"
          />
          <Card>
            <CardHeader title="平台" />
            <div className="flex flex-wrap gap-2">
              {skill.platforms.map((platform) => <span key={platform} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{platform}</span>)}
            </div>
          </Card>
          <Card>
            <CardHeader title="版本记录" />
            <div className="space-y-3">
              {versions.length > 0 ? versions.map((version) => (
                <div key={version.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{version.version}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(version.released_at ?? version.created_at)}</p>
                  {version.notes ? <p className="mt-2 text-sm leading-6 text-slate-600">{version.notes}</p> : null}
                </div>
              )) : <p className="text-sm text-slate-500">暂无版本记录</p>}
            </div>
          </Card>
          <AdminFormSection title="新增版本记录">
            <form action={createSkillVersionAction.bind(null, skill.id)} className="space-y-4">
              <Field label="版本号"><TextInput name="version" placeholder="v1.1.0" required /></Field>
              <Field label="更新说明"><Textarea name="notes" /></Field>
              <Field label="发布时间"><TextInput name="released_at" type="datetime-local" /></Field>
              <SubmitButton>新增版本</SubmitButton>
            </form>
          </AdminFormSection>
        </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
