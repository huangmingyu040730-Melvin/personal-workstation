import Link from "next/link";
import { Download, FileText, FolderArchive, Upload } from "lucide-react";
import { AdminEmptyState, AdminSecurityNote } from "@/components/admin-ui";
import { Card, CardHeader } from "@/components/card";
import type { DocumentCategory, DocumentCollectionType, DocumentCollectionWithRelation, DocumentRelatedType, DocumentWithRelation } from "@/lib/content-types";
import { getDocumentCategoryLabel, getDocumentCollectionTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getDocumentCollectionsByRelated, getDocumentsByRelated } from "@/lib/queries/documents";

type RelatedDocumentsPanelProps = {
  relatedType: DocumentRelatedType;
  relatedId: string;
  title: string;
  description?: string;
  uploadFileLabel?: string;
  uploadBatchLabel?: string;
  uploadFileCategory?: DocumentCategory;
  uploadBatchCategory?: DocumentCategory;
  uploadBatchCollectionType?: DocumentCollectionType;
  emptyText?: string;
  securityNote?: string;
};

export function buildRelatedDocumentUploadHref({
  relatedType,
  relatedId,
  mode,
  category,
  collectionType
}: {
  relatedType: DocumentRelatedType;
  relatedId: string;
  mode: "single" | "batch";
  category: DocumentCategory;
  collectionType?: DocumentCollectionType;
}) {
  const params = new URLSearchParams({
    related_type: relatedType,
    related_id: relatedId,
    mode,
    category
  });

  if (collectionType) {
    params.set("collection_type", collectionType);
  }

  return `/dashboard/documents/upload?${params.toString()}`;
}

function buildRelatedDocumentsListHref(relatedType: DocumentRelatedType, relatedId: string) {
  const params = new URLSearchParams({
    related_type: relatedType,
    related_id: relatedId
  });

  return `/dashboard/documents?${params.toString()}`;
}

function groupRelatedDocuments(documents: DocumentWithRelation[], collections: DocumentCollectionWithRelation[]) {
  const collectionIds = new Set(collections.map((collection) => collection.id));

  return {
    standaloneDocuments: documents.filter((document) => !document.collection_id),
    crossCollectionDocuments: documents.filter((document) => document.collection_id && !collectionIds.has(document.collection_id)),
    packagedDocumentsInCurrentCollections: documents.filter((document) => document.collection_id && collectionIds.has(document.collection_id))
  };
}

export async function RelatedDocumentsPanel({
  relatedType,
  relatedId,
  title,
  description = "关联文件均为私密附件，只在管理员后台显示。",
  uploadFileLabel = "上传文件",
  uploadBatchLabel = "上传文件夹 / 文档包",
  uploadFileCategory = "research_material",
  uploadBatchCategory = uploadFileCategory,
  uploadBatchCollectionType = "attachment_bundle",
  emptyText = "还没有关联文件。可以上传文件或文件夹作为私密研究附件。",
  securityNote
}: RelatedDocumentsPanelProps) {
  const [documents, collections] = await Promise.all([
    getDocumentsByRelated(relatedType, relatedId),
    getDocumentCollectionsByRelated(relatedType, relatedId)
  ]);
  const uploadFileHref = buildRelatedDocumentUploadHref({
    relatedType,
    relatedId,
    mode: "single",
    category: uploadFileCategory
  });
  const uploadBatchHref = buildRelatedDocumentUploadHref({
    relatedType,
    relatedId,
    mode: "batch",
    category: uploadBatchCategory,
    collectionType: uploadBatchCollectionType
  });
  const documentsListHref = buildRelatedDocumentsListHref(relatedType, relatedId);
  const {
    standaloneDocuments,
    crossCollectionDocuments,
    packagedDocumentsInCurrentCollections
  } = groupRelatedDocuments(documents, collections);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={uploadFileHref} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
              <Upload size={15} />
              {uploadFileLabel}
            </Link>
            <Link href={uploadBatchHref} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              <FolderArchive size={15} />
              {uploadBatchLabel}
            </Link>
            <Link href={documentsListHref} className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              查看全部文件
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-slate-500">文档包数量</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{collections.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-slate-500">文件数量</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{documents.length}</p>
        </div>
      </div>

      {securityNote ? <div className="mt-4"><AdminSecurityNote>{securityNote}</AdminSecurityNote></div> : null}

      {documents.length === 0 && collections.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState title="还没有关联文件" description={emptyText} />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {collections.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-900">文档包</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/60"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <FolderArchive className="mt-0.5 shrink-0 text-blue-700" size={18} />
                      <div className="min-w-0">
                        <Link href={`/dashboard/documents/collections/${collection.id}`} className="break-words font-semibold text-slate-950 hover:text-blue-700">
                          {collection.title}
                        </Link>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {getDocumentCollectionTypeLabel(collection.collection_type)} · {collection.file_count} 个文件 · {formatFileSize(collection.total_size)}
                        </p>
                        {collection.file_count === 0 ? (
                          <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            空文档包
                          </span>
                        ) : null}
                        <p className="mt-1 truncate text-xs text-slate-400">{collection.root_folder_name ?? "未记录根文件夹"} · {formatDateTime(collection.updated_at)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={`/dashboard/documents/collections/${collection.id}`} className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700">
                            查看文档包
                          </Link>
                          <form method="post" action={`/dashboard/documents/collections/${collection.id}/download-zip`}>
                            <button type="submit" className="inline-flex items-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                              <Download size={14} />
                              下载 zip
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {packagedDocumentsInCurrentCollections.length > 0 ? (
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                  文档包内文件已归入对应文档包，不在独立文件中重复展示。
                </p>
              ) : null}
            </section>
          ) : null}

          {standaloneDocuments.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-900">独立文件</h3>
              <div className="mt-3 space-y-3">
                {standaloneDocuments.map((document) => (
                  <RelatedDocumentRow key={document.id} document={document} />
                ))}
              </div>
            </section>
          ) : null}

          {crossCollectionDocuments.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-900">跨文档包文件</h3>
              <p className="mt-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                这些文件的文件级关联指向当前对象，但它们仍属于其他文档包。如需整体迁移，请进入文档包详情页调整文档包关联，或在后续阶段使用文档包整体迁移功能。
              </p>
              <div className="mt-3 space-y-3">
                {crossCollectionDocuments.map((document) => (
                  <RelatedDocumentRow key={document.id} document={document} showCollection />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function RelatedDocumentRow({ document, showCollection = false }: { document: DocumentWithRelation; showCollection?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <FileText className="mt-1 shrink-0 text-blue-700" size={18} />
        <div className="min-w-0">
          <Link href={`/dashboard/documents/${document.id}`} className="break-words font-medium text-slate-900 hover:text-blue-700">
            {document.name}
          </Link>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {getDocumentCategoryLabel(document.category)} · {formatFileSize(document.file_size)} · {formatDateTime(document.created_at)}
          </p>
          {document.relative_path ? <p className="mt-1 break-all text-xs text-slate-400">{document.relative_path}</p> : null}
          {showCollection && document.collection ? (
            <Link href={`/dashboard/documents/collections/${document.collection.id}`} className="mt-1 inline-flex max-w-full text-xs font-medium text-blue-700 hover:text-blue-900">
              <span className="truncate">所属文档包：{document.collection.title}</span>
            </Link>
          ) : null}
          {showCollection && document.collection_id && !document.collection ? (
            <p className="mt-1 text-xs text-slate-400">所属文档包未能读取</p>
          ) : null}
        </div>
      </div>
      <Link href={`/dashboard/documents/${document.id}/download`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700">
        <Download size={16} />
        下载
      </Link>
    </div>
  );
}
