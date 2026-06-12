import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteDocumentCollectionAction, deleteDocumentCollectionWithFilesAction, syncDocumentCollectionRelationsAction, updateDocumentCollectionMetadataAction } from "@/actions/documents";
import { AdminDangerZone, AdminEmptyState, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DocumentBulkActionsForm } from "@/components/forms/document-bulk-actions-form";
import { DocumentCollectionDeleteForm } from "@/components/forms/document-collection-delete-form";
import { DocumentCollectionForm } from "@/components/forms/document-collection-form";
import { DocumentCollectionSyncForm } from "@/components/forms/document-collection-sync-form";
import { DeleteButton, SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getDocumentCollectionTypeLabel, getDocumentRelatedTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getDocumentCollectionById, getDocumentsByCollectionId } from "@/lib/queries/documents";
import { getKnowledgeNoteOptions } from "@/lib/queries/knowledge";
import { getPublicationOptions } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";
import { getSkillOptions } from "@/lib/queries/skills";

export default async function DocumentCollectionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [collection, documents, projects, publications, knowledgeNotes, skills] = await Promise.all([
    getDocumentCollectionById(id),
    getDocumentsByCollectionId(id),
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions()
  ]);

  if (!collection) {
    notFound();
  }

  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";
  const updatedNotice = query.notice === "collection_updated";
  const bulkUpdatedNotice = query.notice === "bulk_relations_updated";
  const bulkUnlinkedNotice = query.notice === "bulk_unlinked";
  const documentsDeletedNotice = query.notice === "documents_deleted";
  const collectionSyncedNotice = query.notice === "collection_relations_synced";
  const collectionUnlinkedNotice = query.notice === "collection_relations_unlinked";
  const bulkCount = Number(getSingleQueryValue(query.count) ?? 0);
  const deleteAction = deleteDocumentCollectionAction.bind(null, collection.id);
  const deleteWithFilesAction = deleteDocumentCollectionWithFilesAction.bind(null, collection.id);
  const updateAction = updateDocumentCollectionMetadataAction.bind(null, collection.id);
  const syncAction = syncDocumentCollectionRelationsAction.bind(null, collection.id);
  const relatedOptions = { projects, publications, knowledgeNotes, skills };
  const collectionReturnTo = `/dashboard/documents/collections/${collection.id}`;
  const hasRelationMismatch = documents.some((document) => (
    document.related_type !== collection.related_type || document.related_id !== collection.related_id
  ));

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow={getDocumentCollectionTypeLabel(collection.collection_type)}
          title={collection.title}
          description="一次上传批次、文件夹或附件包。文件仍保存在 private bucket 中，只允许管理员下载。"
          action={
            <Link href="/dashboard/documents/upload" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
              <Upload size={18} />
              继续上传
            </Link>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            空文档包已删除。
          </div>
        ) : null}
        {updatedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            文档包信息已更新。包内文件的关联对象没有被批量修改。
          </div>
        ) : null}
        {bulkUpdatedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已更新 {bulkCount || documents.length} 个文件的关联对象。文档包自身关联对象没有改变。
          </div>
        ) : null}
        {bulkUnlinkedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已解除 {bulkCount || documents.length} 个文件的关联对象。Storage object 未移动、未删除，文档包归属没有改变。
          </div>
        ) : null}
        {documentsDeletedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已删除 {bulkCount} 个文件记录及对应 Storage object。文档包本身已保留，可能变为空包。
          </div>
        ) : null}
        {collectionSyncedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已将文档包及 {bulkCount || documents.length} 个文件整体迁移到目标对象。
          </div>
        ) : null}
        {collectionUnlinkedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已解除文档包及 {bulkCount || documents.length} 个文件的关联。Storage object 未移动、未删除。
          </div>
        ) : null}
        <AdminSecurityNote>文档包只是私密附件管理层。即使关联公开 Project、Publication、Knowledge 或 Skill，也不会在公开页面展示附件下载入口。</AdminSecurityNote>
        {hasRelationMismatch ? (
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            文档包关联对象与部分文件关联对象可能不同；如需整体迁移资料包，请使用“同步文档包与包内文件关联”。
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <Card className="min-w-0 overflow-hidden p-0">
            <div className="border-b border-slate-100 px-5 py-4">
              <CardHeader title="文件列表" description="文件夹上传会保留每个文件的 relative_path。" />
            </div>
            {documents.length === 0 ? (
              <div className="p-5">
                <AdminEmptyState title="文档包里还没有文件" description="如果批量上传全部失败，文档包会保留为诊断记录；可以重新上传文件。" />
              </div>
            ) : (
              <DocumentBulkActionsForm
                documents={documents}
                relatedOptions={relatedOptions}
                returnTo={collectionReturnTo}
                mode="collection"
              />
            )}
          </Card>

          <aside className="min-w-0 space-y-5">
            <Card className="overflow-hidden">
              <CardHeader title="文档包信息" />
              <dl className="space-y-3 text-sm">
                <InfoRow label="类型" value={getDocumentCollectionTypeLabel(collection.collection_type)} />
                <InfoRow label="根文件夹" value={collection.root_folder_name ?? "未记录"} />
                <InfoRow label="文件数" value={`${collection.file_count}`} />
                <InfoRow label="总大小" value={formatFileSize(collection.total_size)} />
                <InfoRow label="创建时间" value={formatDateTime(collection.created_at)} />
                <InfoRow label="更新时间" value={formatDateTime(collection.updated_at)} />
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <dt className="shrink-0 text-slate-500">权限</dt>
                  <dd className="min-w-0 text-right"><VisibilityBadge visibility={collection.visibility} /></dd>
                </div>
              </dl>
            </Card>

            <Card className="overflow-hidden border-blue-100 bg-blue-50/50">
              <CardHeader
                title="Zip 下载"
                description="临时打包文档包内文件，不保存到 Storage，也不修改任何 metadata。"
              />
              <div className="space-y-3 text-sm leading-6 text-blue-800">
                <p>当前限制：最多 50 个文件，总大小 100 MB。超限时请拆分下载。</p>
                <form method="post" action={`/dashboard/documents/collections/${collection.id}/download-zip`}>
                  <SubmitButton variant="secondary" pendingLabel="zip 生成中..." className="gap-2 px-4 py-2.5">
                    <Download size={16} />
                    下载整个文档包 zip
                  </SubmitButton>
                </form>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title="关联对象" />
              {collection.related ? (
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">{getDocumentRelatedTypeLabel(collection.related.type)}</p>
                  <Link href={collection.related.href} className="mt-1 block break-words font-semibold text-slate-950 hover:text-blue-700">{collection.related.title}</Link>
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">未关联任何对象。</p>
              )}
            </Card>

            {collection.description ? (
              <Card className="overflow-hidden">
                <CardHeader title="说明" />
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{collection.description}</p>
              </Card>
            ) : null}

            <DocumentCollectionForm
              action={updateAction}
              collection={collection}
              relatedOptions={relatedOptions}
            />

            <DocumentCollectionSyncForm
              action={syncAction}
              collection={collection}
              documentCount={documents.length}
              relatedOptions={relatedOptions}
            />

            {documents.length === 0 ? (
              <AdminDangerZone description="删除空文档包只会清理文档包记录，不删除任何文件或 Storage 对象。">
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-rose-700">
                    该文档包当前不包含文件，可以删除空文档包记录。
                  </p>
                  <form action={deleteAction}>
                    <DeleteButton label="删除空文档包" />
                  </form>
                </div>
              </AdminDangerZone>
            ) : (
              <DocumentCollectionDeleteForm action={deleteWithFilesAction} documentCount={documents.length} />
            )}
          </aside>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
