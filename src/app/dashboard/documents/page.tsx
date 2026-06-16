import Link from "next/link";
import { ArrowRight, FolderOpen, Upload } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { DocumentBulkActionsForm } from "@/components/forms/document-bulk-actions-form";
import { PageHeader } from "@/components/page-header";
import { documentCategories, documentRelatedTypes, getDocumentCollectionTypeLabel, getDocumentRelatedTypeLabel } from "@/lib/content-options";
import type { DocumentCollectionWithRelation } from "@/lib/content-types";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getDocumentCollections, getDocuments } from "@/lib/queries/documents";
import { getKnowledgeNoteOptions } from "@/lib/queries/knowledge";
import { getPublicationOptions } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";
import { getSkillOptions } from "@/lib/queries/skills";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const relatedType = params.related_type ?? "all";
  const relatedId = params.related_id;
  const collection = params.collection ?? "all";
  const error = getFormError(params);
  const collectionDeletedNotice = params.notice === "collection_deleted";
  const collectionDeletedWithFilesNotice = params.notice === "collection_deleted_with_files";
  const documentsDeletedNotice = params.notice === "documents_deleted";
  const bulkUpdatedNotice = params.notice === "bulk_relations_updated";
  const bulkUnlinkedNotice = params.notice === "bulk_unlinked";
  const assetLinksAddedNotice = params.notice === "document_asset_links_added";
  const assetLinksRemovedNotice = params.notice === "document_asset_links_removed";
  const assetLinksClearedNotice = params.notice === "document_asset_links_cleared";
  const visibilityUpdatedNotice = params.notice === "documents_visibility_updated";
  const bulkCount = Number(params.count ?? 0);
  const [collections, independentDocuments, projects, publications, knowledgeNotes, skills] = await Promise.all([
    getDocumentCollections({ category, relatedType, relatedId, collection }),
    collection === "with_collection"
      ? Promise.resolve([])
      : getDocuments({ category, relatedType, relatedId, collection: "without_collection" }),
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions()
  ]);
  const returnTo = getDocumentsReturnTo({ category, relatedType, relatedId, collection });
  const relatedOptions = { projects, publications, knowledgeNotes, skills };
  const noticeFallbackCount = bulkCount || independentDocuments.length;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Documents"
          title="文件中心"
          description="优先用文档包组织成组资料，再用独立文件承接暂未归档的研究、成果、Skill 与个人私密文件。"
          action={
            <Link href="/dashboard/documents/upload" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
              <Upload size={18} />
              上传文件
            </Link>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {collectionDeletedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            空文档包已删除。
          </div>
        ) : null}
        {collectionDeletedWithFilesNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            文档包及 {bulkCount} 个文件已删除，相关 Storage object 已清理。
          </div>
        ) : null}
        {documentsDeletedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已删除 {noticeFallbackCount} 个文件记录及对应 Storage object。文档包本身不会自动删除。
          </div>
        ) : null}
        {bulkUpdatedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已更新 {noticeFallbackCount} 个文件的关联对象。
          </div>
        ) : null}
        {bulkUnlinkedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已解除 {noticeFallbackCount} 个文件的关联对象。Storage object 未移动、未删除。
          </div>
        ) : null}
        {assetLinksAddedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已为 {noticeFallbackCount} 个文件添加多关联。Storage object 未移动、未重命名。
          </div>
        ) : null}
        {assetLinksRemovedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已从 {noticeFallbackCount} 个文件移除指定关联，其他关联已保留。
          </div>
        ) : null}
        {assetLinksClearedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已清空 {noticeFallbackCount} 个文件的全部多关联。Storage object 未移动、未删除。
          </div>
        ) : null}
        {visibilityUpdatedNotice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已更新 {noticeFallbackCount} 个文件的公开状态。Storage object 未移动、未重命名。
          </div>
        ) : null}
        <AdminSecurityNote>
          文件中心用于管理研究资料、成果附件、Skill 附件，以及签证、身份、生活、求职、合同等个人私密资料。上传默认私密；建议优先用文档包组织成组资料。只有显式设为公开且关联到公开内容的文件，才会通过公开页面的安全下载路由提供下载。
        </AdminSecurityNote>

        <AdminSection title="筛选" description="筛选会同时影响文档包列表和下方独立文件；已加入文档包的文件请进入对应文档包查看。">
          <form className="flex flex-wrap gap-3">
            <select name="category" defaultValue={category} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:w-auto">
              <option value="all">全部分类</option>
              {documentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select name="related_type" defaultValue={relatedType} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:w-auto">
              <option value="all">全部关联</option>
              {documentRelatedTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              <option value="unlinked">未关联文件</option>
            </select>
            <select name="collection" defaultValue={collection} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:w-auto">
              <option value="all">全部文档包状态</option>
              <option value="with_collection">已加入文档包</option>
              <option value="without_collection">未加入文档包</option>
            </select>
            <button className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 sm:w-auto">筛选</button>
            {relatedId && relatedType !== "all" && relatedType !== "unlinked" ? (
              <Link href={`/dashboard/documents?category=${category}&related_type=${relatedType}&collection=${collection}`} className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700 sm:w-auto">
                清除具体对象
              </Link>
            ) : null}
          </form>
          {relatedId && relatedType !== "all" && relatedType !== "unlinked" ? (
            <p className="mt-3 text-sm text-slate-500">当前结果已按具体关联对象筛选；更改上方筛选会清除这个对象级约束。</p>
          ) : null}
        </AdminSection>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">文档包</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                用于组织签证、身份、生活、求职、合同、研究资料包等成组文件；个人资料目前建议先通过文档包管理，暂不新增 Profile 真实文件关联。
              </p>
            </div>
            <span className="text-sm font-medium text-slate-500">{collections.length} 个文档包</span>
          </div>

          {collections.length === 0 ? (
            <AdminEmptyState
              title={getCollectionEmptyTitle(collection)}
              description={getCollectionEmptyDescription(collection)}
              action={<Link href="/dashboard/documents/upload?mode=batch&collection_type=folder_upload" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">上传文件夹</Link>}
            />
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {collections.map((item) => (
                <DocumentCollectionCard key={item.id} collection={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">独立文件</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                未加入文档包的文件会暂时显示在这里，后续可以批量归入文档包或关联到资产。
              </p>
            </div>
            <span className="text-sm font-medium text-slate-500">{independentDocuments.length} 个独立文件</span>
          </div>

          {independentDocuments.length === 0 ? (
            <AdminEmptyState
              title={collection === "with_collection" ? "当前筛选只显示文档包" : "没有独立文件"}
              description={collection === "with_collection" ? "已加入文档包的文件请进入上方文档包详情页查看；这里仅展示未加入文档包的文件。" : "所有文件都已经归入文档包，或当前筛选下没有未加入文档包的文件。"}
              action={<Link href="/dashboard/documents/upload" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">上传文件</Link>}
            />
          ) : (
            <Card className="min-w-0 overflow-hidden p-0">
              <DocumentBulkActionsForm
                documents={independentDocuments}
                relatedOptions={relatedOptions}
                returnTo={returnTo}
              />
            </Card>
          )}
        </section>
      </AdminPageSurface>
    </AppShell>
  );
}

function DocumentCollectionCard({ collection }: { collection: DocumentCollectionWithRelation }) {
  return (
    <Link
      href={`/dashboard/documents/collections/${collection.id}`}
      className="group flex h-full min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <FolderOpen size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-6 text-slate-950 [overflow-wrap:anywhere]">{collection.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{getDocumentCollectionTypeLabel(collection.collection_type)}</p>
        </div>
        <ArrowRight className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" size={18} />
      </div>

      <dl className="mt-5 grid min-w-0 grid-cols-2 gap-3 text-sm">
        <CollectionMetric label="文件数量" value={`${collection.file_count} 个`} />
        <CollectionMetric label="总大小" value={formatFileSize(collection.total_size)} />
        <CollectionMetric label="更新时间" value={formatDateTime(collection.updated_at)} />
        <CollectionMetric label="根目录" value={collection.root_folder_name ?? "未记录"} />
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">关联对象</p>
        <CollectionRelationSummary collection={collection} />
      </div>
    </Link>
  );
}

function CollectionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 min-w-0 break-words font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function CollectionRelationSummary({ collection }: { collection: DocumentCollectionWithRelation }) {
  if (collection.relations.length === 0 && !collection.related) {
    return <span className="text-sm text-slate-400">未关联</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {collection.relations.map((relation) => (
        <span key={relation.id} className="inline-flex max-w-full items-start gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium leading-5 text-blue-800">
          <span className="shrink-0 text-blue-500">{getDocumentRelatedTypeLabel(relation.asset_type)}</span>
          <span className="min-w-0 [overflow-wrap:anywhere]">{relation.title}</span>
          <span className="shrink-0 text-blue-400">· {relation.relation_label}</span>
        </span>
      ))}
      {collection.relations.length === 0 && collection.related ? (
        <span className="inline-flex max-w-full items-start gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium leading-5 text-slate-600">
          <span className="shrink-0 text-slate-400">{getDocumentRelatedTypeLabel(collection.related.type)}</span>
          <span className="min-w-0 [overflow-wrap:anywhere]">{collection.related.title}</span>
        </span>
      ) : null}
    </div>
  );
}

function getCollectionEmptyTitle(collection: string) {
  return collection === "without_collection" ? "当前筛选只查看独立文件" : "还没有文档包";
}

function getCollectionEmptyDescription(collection: string) {
  if (collection === "without_collection") {
    return "未加入文档包筛选会隐藏文档包区域；下方独立文件区域会显示符合条件的文件。";
  }

  return "上传文件夹或创建附件包后，文件中心首页会先展示文档包，再展示未归档的独立文件。";
}

function getDocumentsReturnTo({
  category,
  relatedType,
  relatedId,
  collection
}: {
  category: string;
  relatedType: string;
  relatedId?: string;
  collection: string;
}) {
  const params = new URLSearchParams();

  params.set("category", category);
  params.set("related_type", relatedType);
  params.set("collection", collection);

  if (relatedId && relatedType !== "all" && relatedType !== "unlinked") {
    params.set("related_id", relatedId);
  }

  return `/dashboard/documents?${params.toString()}`;
}
