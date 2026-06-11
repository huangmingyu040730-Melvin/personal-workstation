import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProjectAction } from "@/actions/projects";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/progress";
import { RelatedDocumentsPanel } from "@/components/related-documents-panel";
import { formatDate, formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getProjectById } from "@/lib/queries/projects";

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const deleteAction = deleteProjectAction.bind(null, project.id);
  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Project Detail"
          title={project.title}
          description={project.summary}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/projects/${project.id}/edit`} className="rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">编辑</Link>
              <form action={deleteAction}>
                <DeleteButton />
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
        <div className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="研究背景" />
            <MarkdownPreview content={project.background} emptyText="尚未填写研究背景。" />
          </Card>
          <Card>
            <CardHeader title="研究问题" />
            <MarkdownPreview content={project.research_question} emptyText="尚未填写研究问题。" />
          </Card>
          <Card>
            <CardHeader title="研究方法" />
            <MarkdownPreview content={project.methodology} emptyText="尚未填写研究方法。" />
          </Card>
          <RelatedDocumentsPanel
            relatedType="project"
            relatedId={project.id}
            title="项目文件"
            uploadFileLabel="上传项目文件"
            uploadBatchLabel="上传项目文件夹"
            uploadFileCategory="research_material"
            uploadBatchCategory="research_material"
            uploadBatchCollectionType="folder_upload"
            emptyText="还没有关联项目文件。可以上传研究资料、数据文件或项目文件夹作为私密附件。"
          />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="项目状态" action={<VisibilityBadge visibility={project.visibility} />} />
            <div className="flex items-center justify-between">
              <StatusBadge status={project.status} />
              <span className="text-sm font-semibold text-slate-900">{project.progress}%</span>
            </div>
            <div className="mt-4">
              <Progress value={project.progress} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">slug</dt><dd className="font-medium text-slate-800">{project.slug}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">开始日期</dt><dd className="font-medium text-slate-800">{formatDate(project.start_date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{project.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(project.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {project.tags.length > 0 ? project.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-slate-500">暂无标签</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="里程碑" />
            <div className="space-y-3">
              {project.milestones.length > 0 ? project.milestones.map((milestone, index) => (
                <div key={milestone} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold text-blue-700">{index + 1}</span>
                  {milestone}
                </div>
              )) : <p className="text-sm text-slate-500">暂无里程碑</p>}
            </div>
          </Card>
        </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
