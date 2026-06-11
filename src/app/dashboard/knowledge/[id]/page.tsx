import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { RelatedDocumentsPanel } from "@/components/related-documents-panel";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getKnowledgeNoteById } from "@/lib/queries/knowledge";

export default async function KnowledgeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const note = await getKnowledgeNoteById(id);

  if (!note) {
    notFound();
  }

  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow={note.category}
          title={note.title}
          description={note.excerpt ?? "暂无摘要"}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/knowledge/${note.id}/edit`} className="rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">编辑</Link>
              <form action={deleteKnowledgeAction.bind(null, note.id)}>
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
        <div className="grid gap-5 xl:grid-cols-[1fr_0.35fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="正文" action={<VisibilityBadge visibility={note.visibility} />} />
            <MarkdownPreview content={note.content} />
          </Card>
          <RelatedDocumentsPanel
            relatedType="knowledge"
            relatedId={note.id}
            title="笔记资料"
            uploadFileLabel="上传资料"
            uploadBatchLabel="上传资料文件夹"
            uploadFileCategory="research_material"
            uploadBatchCategory="research_material"
            uploadBatchCollectionType="attachment_bundle"
            emptyText="还没有关联笔记资料。可以上传参考文献、数据文件或资料包作为私密附件。"
          />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="笔记信息" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">slug</dt><dd className="font-medium text-slate-800">{note.slug}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{note.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">关联项目</dt><dd className="font-medium text-slate-800">{note.projects?.title ?? "未关联"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(note.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {note.tags.length > 0 ? note.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tag}</span>) : <p className="text-sm text-slate-500">暂无标签</p>}
            </div>
          </Card>
        </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
