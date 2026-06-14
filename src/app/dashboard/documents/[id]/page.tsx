import Link from "next/link";
import { Download, X } from "lucide-react";
import { notFound } from "next/navigation";
import { addDocumentAssetLinksAction, deleteDocumentAction, removeDocumentAssetLinkAction, updateDocumentMetadataAction } from "@/actions/documents";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DocumentRelationChips } from "@/components/documents/document-relation-chips";
import { DocumentAssetLinksForm } from "@/components/forms/document-asset-links-form";
import { DocumentMetadataForm } from "@/components/forms/document-metadata-form";
import { DeleteButton, SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getDocumentCategoryLabel, getDocumentCollectionTypeLabel } from "@/lib/content-options";
import type { DocumentAssetLinkSummary } from "@/lib/content-types";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getKnowledgeNoteOptions } from "@/lib/queries/knowledge";
import { getDocumentById } from "@/lib/queries/documents";
import { getPublicationOptions } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";
import { getSkillOptions } from "@/lib/queries/skills";

export default async function DocumentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [document, projects, publications, knowledgeNotes, skills] = await Promise.all([
    getDocumentById(id),
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions()
  ]);

  if (!document) {
    notFound();
  }

  const error = getFormError(query);
  const notice = query.notice === "metadata_updated";
  const assetLinksAddedNotice = query.notice === "document_asset_links_added";
  const assetLinkRemovedNotice = query.notice === "document_asset_link_removed";
  const updateAction = updateDocumentMetadataAction.bind(null, document.id);
  const addLinksAction = addDocumentAssetLinksAction;
  const detailReturnTo = `/dashboard/documents/${document.id}`;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow={getDocumentCategoryLabel(document.category)}
          title={document.name}
          description="私密文件详情。下载链接按需生成，短时有效，不保存到数据库。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/documents/${document.id}/download`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Download size={16} />
                下载文件
              </Link>
              <form action={deleteDocumentAction.bind(null, document.id)}>
                <DeleteButton label="删除文件" />
              </form>
            </div>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            文件信息已更新。Storage object 未移动、未重命名。
          </div>
        ) : null}
        {assetLinksAddedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            文件关联已添加。Storage object 未移动、未重命名。
          </div>
        ) : null}
        {assetLinkRemovedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            文件关联已移除，其他关联已保留。
          </div>
        ) : null}
        <AdminSecurityNote>文件始终保存在 private bucket 中。管理员下载和公开下载都会按需生成短时链接；公开页面只显示显式 public 且关联到当前公开内容的文件，不输出 Storage 路径或 signed URL。</AdminSecurityNote>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="文件元数据" />
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件分类</dt><dd className="mt-1 font-medium text-slate-900">{getDocumentCategoryLabel(document.category)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件类型</dt><dd className="mt-1 break-all font-medium text-slate-900">{document.mime_type}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件大小</dt><dd className="mt-1 font-medium text-slate-900">{formatFileSize(document.file_size)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">权限</dt><dd className="mt-1"><VisibilityBadge visibility={document.visibility} /></dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">原始文件名</dt><dd className="mt-1 break-all font-medium text-slate-900">{document.original_name ?? document.name}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件夹路径</dt><dd className="mt-1 break-all font-medium text-slate-900">{document.folder_path ?? "根目录"}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2"><dt className="text-slate-500">相对路径</dt><dd className="mt-1 break-all font-medium text-slate-900">{document.relative_path ?? "未记录"}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">上传时间</dt><dd className="mt-1 font-medium text-slate-900">{formatDateTime(document.created_at)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">更新时间</dt><dd className="mt-1 font-medium text-slate-900">{formatDateTime(document.updated_at)}</dd></div>
            </dl>
          </Card>
          <DocumentMetadataForm
            action={updateAction}
            document={document}
            relatedOptions={{ projects, publications, knowledgeNotes, skills }}
          />
        </div>
        <div className="min-w-0 space-y-5">
        <Card className="overflow-hidden">
          <CardHeader title="文档包" />
          {document.collection ? (
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm text-blue-700">{getDocumentCollectionTypeLabel(document.collection.collection_type)}</p>
              <Link href={`/dashboard/documents/collections/${document.collection.id}`} className="mt-1 block break-words font-semibold text-slate-950 hover:text-blue-700">{document.collection.title}</Link>
              <p className="mt-2 text-sm text-slate-500">{document.collection.file_count} 个文件 · {formatFileSize(document.collection.total_size)}</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">未加入文档包。</p>
          )}
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="关联资产" description="一个文件可以同时关联多个 Project、Publication、Knowledge 或 Skill。" />
          <div className="space-y-4">
            <DocumentRelationChips relations={document.relations} emptyLabel="未关联任何项目、成果、知识文章或 Skill。" />
            <RemovableDocumentRelations relations={document.relations} returnTo={detailReturnTo} />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="添加关联" description="只新增文件与资产的关系，不移动或重命名 Storage object。" />
          <DocumentAssetLinksForm
            action={addLinksAction}
            documentIds={[document.id]}
            relatedOptions={{ projects, publications, knowledgeNotes, skills }}
            returnTo={detailReturnTo}
            submitLabel="添加到该文件"
          />
        </Card>
        </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function RemovableDocumentRelations({
  relations,
  returnTo
}: {
  relations: DocumentAssetLinkSummary[];
  returnTo: string;
}) {
  const removableRelations = relations.filter((relation) => !relation.id.startsWith("legacy:"));

  if (removableRelations.length === 0) {
    return relations.length > 0 ? (
      <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
        当前仅有 legacy primary relation。执行 0020 回填后可作为独立关联移除。
      </p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      {removableRelations.map((relation) => (
        <form key={relation.id} action={removeDocumentAssetLinkAction.bind(null, relation.id)} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
          <input type="hidden" name="return_to" value={returnTo} />
          <span className="min-w-0 truncate text-sm text-slate-600">
            {relation.title} · {relation.relation_label}
          </span>
          <SubmitButton variant="secondary" pendingLabel="移除中..." className="shrink-0 gap-1 px-2.5 py-1.5 text-xs">
            <X size={13} />
            移除
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
