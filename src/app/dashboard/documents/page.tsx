import Link from "next/link";
import { Download, FileText, Upload } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { documentCategories, documentRelatedTypes, getDocumentCategoryLabel, getDocumentRelatedTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getDocuments } from "@/lib/queries/documents";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const relatedType = params.related_type ?? "all";
  const documents = await getDocuments({ category, relatedType });

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
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
      </form>
      </AdminSection>
      {documents.length === 0 ? (
        <AdminEmptyState title="还没有文件记录" description="上传第一个文件后，文件中心会显示真实 Storage 元数据。" action={<Link href="/dashboard/documents/upload" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">上传文件</Link>} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="min-w-[1040px]">
            <div className="grid grid-cols-[1.3fr_0.5fr_0.45fr_0.75fr_0.75fr_0.6fr_0.4fr_0.45fr] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500">
              <span>文件名</span>
              <span>分类</span>
              <span>大小</span>
              <span>文档包</span>
              <span>关联对象</span>
              <span>上传时间</span>
              <span>权限</span>
              <span>操作</span>
            </div>
            {documents.map((document) => (
              <div key={document.id} className="grid grid-cols-[1.3fr_0.5fr_0.45fr_0.75fr_0.75fr_0.6fr_0.4fr_0.45fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-blue-50/60 last:border-0">
                <Link href={`/dashboard/documents/${document.id}`} className="flex min-w-0 gap-2 font-medium text-slate-900 hover:text-blue-700">
                  <FileText className="mt-0.5 shrink-0 text-blue-700" size={16} />
                  <span className="min-w-0">
                    <span className="block truncate">{document.name}</span>
                    {document.relative_path ? <span className="mt-0.5 block truncate text-xs font-normal text-slate-400">{document.relative_path}</span> : null}
                  </span>
                </Link>
                <span className="text-slate-600">{getDocumentCategoryLabel(document.category)}</span>
                <span className="text-slate-500">{formatFileSize(document.file_size)}</span>
                <span className="truncate text-slate-500">
                  {document.collection ? (
                    <Link href={`/dashboard/documents/collections/${document.collection.id}`} className="text-blue-700 hover:text-blue-900">
                      {document.collection.title}
                    </Link>
                  ) : (
                    "未加入文档包"
                  )}
                </span>
                <span className="truncate text-slate-500">{document.related?.title ?? getDocumentRelatedTypeLabel(document.related_type)}</span>
                <span className="text-slate-500">{formatDateTime(document.created_at)}</span>
                <VisibilityBadge visibility={document.visibility} />
                <Link href={`/dashboard/documents/${document.id}/download`} className="inline-flex items-center gap-1 font-medium text-blue-700">
                  <Download size={14} />
                  下载
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
      </AdminPageSurface>
    </AppShell>
  );
}
