import Link from "next/link";
import { Upload } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { DocumentBulkActionsForm } from "@/components/forms/document-bulk-actions-form";
import { PageHeader } from "@/components/page-header";
import { documentCategories, documentRelatedTypes } from "@/lib/content-options";
import { getFormError } from "@/lib/forms";
import { getDocuments } from "@/lib/queries/documents";
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
  const bulkCount = Number(params.count ?? 0);
  const [documents, projects, publications, knowledgeNotes, skills] = await Promise.all([
    getDocuments({ category, relatedType, relatedId, collection }),
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions()
  ]);
  const returnTo = getDocumentsReturnTo({ category, relatedType, relatedId, collection });

  return (
    <AppShell>
      <AdminPageSurface>
      <PageHeader
        eyebrow="Documents"
        title="文件中心"
        description="统一管理私密文件、文档包和研究附件，上传、下载与删除均受管理员权限和 Storage policy 保护。"
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
          已删除 {bulkCount || documents.length} 个文件记录及对应 Storage object。文档包本身不会自动删除。
        </div>
      ) : null}
      {bulkUpdatedNotice ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          已更新 {bulkCount || documents.length} 个文件的关联对象。
        </div>
      ) : null}
      {bulkUnlinkedNotice ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          已解除 {bulkCount || documents.length} 个文件的关联对象。Storage object 未移动、未删除。
        </div>
      ) : null}
      <AdminSecurityNote>文件中心只面向管理员后台。文件默认私密，公开页面不会展示下载入口、Storage 路径或 signed URL。</AdminSecurityNote>
      <AdminSection>
      <form className="flex flex-wrap gap-3">
        <select name="category" defaultValue={category} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部分类</option>
          {documentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select name="related_type" defaultValue={relatedType} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部关联</option>
          {documentRelatedTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          <option value="unlinked">未关联文件</option>
        </select>
        <select name="collection" defaultValue={collection} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部文档包状态</option>
          <option value="with_collection">已加入文档包</option>
          <option value="without_collection">未加入文档包</option>
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
        {relatedId && relatedType !== "all" && relatedType !== "unlinked" ? (
          <Link href={`/dashboard/documents?category=${category}&related_type=${relatedType}&collection=${collection}`} className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700">
            清除具体对象
          </Link>
        ) : null}
      </form>
      {relatedId && relatedType !== "all" && relatedType !== "unlinked" ? (
        <p className="mt-3 text-sm text-slate-500">当前结果已按具体关联对象筛选；更改上方筛选会清除这个对象级约束。</p>
      ) : null}
      </AdminSection>
      {documents.length === 0 ? (
        <AdminEmptyState title="还没有文件记录" description="上传第一个文件后，文件中心会显示真实 Storage 元数据。" action={<Link href="/dashboard/documents/upload" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">上传文件</Link>} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <DocumentBulkActionsForm
            documents={documents}
            relatedOptions={{ projects, publications, knowledgeNotes, skills }}
            returnTo={returnTo}
          />
        </Card>
      )}
      </AdminPageSurface>
    </AppShell>
  );
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
