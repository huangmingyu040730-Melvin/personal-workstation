import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePublicationAction } from "@/actions/publications";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { buildRelatedDocumentUploadHref, RelatedDocumentsPanel } from "@/components/related-documents-panel";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicationById } from "@/lib/queries/publications";

export default async function PublicationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const publication = await getPublicationById(id);

  if (!publication) {
    notFound();
  }

  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";
  const uploadAttachmentHref = buildRelatedDocumentUploadHref({
    relatedType: "publication",
    relatedId: publication.id,
    mode: "single",
    category: "publication_attachment"
  });

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow={getPublicationTypeLabel(publication.publication_type)}
          title={publication.title}
          description={publication.summary}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={uploadAttachmentHref} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">上传附件</Link>
              <Link href={`/dashboard/publications/${publication.id}/edit`} className="rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">编辑</Link>
              <form action={deletePublicationAction.bind(null, publication.id)}>
                <DeleteButton label="删除成果" />
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
        <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="摘要 / Abstract" />
            <MarkdownPreview content={publication.abstract} emptyText="尚未填写摘要。" />
          </Card>
          <RelatedDocumentsPanel
            relatedType="publication"
            relatedId={publication.id}
            title="成果附件"
            description="成果附件均为私密文件，仅管理员可通过短时链接下载。"
            uploadFileLabel="上传附件"
            uploadBatchLabel="上传附件包"
            uploadFileCategory="publication_attachment"
            uploadBatchCategory="publication_attachment"
            uploadBatchCollectionType="attachment_bundle"
            emptyText="暂无关联附件。上传文件或附件包后，会显示在这里。"
          />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="成果信息" action={<VisibilityBadge visibility={publication.visibility} />} />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">slug</dt><dd className="font-medium text-slate-800">{publication.slug}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">发布日期</dt><dd className="font-medium text-slate-800">{formatDate(publication.published_on)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">关联项目</dt><dd className="font-medium text-slate-800">{publication.projects?.title ?? "未关联"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{publication.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(publication.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {publication.tags.length > 0 ? publication.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-slate-500">暂无标签</p>}
            </div>
          </Card>
        </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
