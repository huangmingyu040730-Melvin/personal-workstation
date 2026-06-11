import Link from "next/link";
import { Download, FileText, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteDocumentCollectionAction } from "@/actions/documents";
import { AdminDangerZone, AdminEmptyState, AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getDocumentCategoryLabel, getDocumentCollectionTypeLabel, getDocumentRelatedTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getDocumentCollectionById, getDocumentsByCollectionId } from "@/lib/queries/documents";

export default async function DocumentCollectionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [collection, documents] = await Promise.all([
    getDocumentCollectionById(id),
    getDocumentsByCollectionId(id)
  ]);

  if (!collection) {
    notFound();
  }

  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";
  const deleteAction = deleteDocumentCollectionAction.bind(null, collection.id);

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
        <AdminSecurityNote>文档包只是私密附件管理层。即使关联公开 Project、Publication、Knowledge 或 Skill，也不会在公开页面展示附件下载入口。</AdminSecurityNote>

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
              <div className="overflow-x-auto">
                <div className="min-w-[920px]">
                  <div className="grid grid-cols-[1.35fr_0.6fr_0.45fr_0.95fr_0.55fr_0.45fr] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500">
                    <span>文件</span>
                    <span>分类</span>
                    <span>大小</span>
                    <span>相对路径</span>
                    <span>上传时间</span>
                    <span>操作</span>
                  </div>
                  {documents.map((document) => (
                    <div key={document.id} className="grid grid-cols-[1.35fr_0.6fr_0.45fr_0.95fr_0.55fr_0.45fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-blue-50/60 last:border-0">
                      <Link href={`/dashboard/documents/${document.id}`} className="flex min-w-0 gap-2 font-medium text-slate-900 hover:text-blue-700">
                        <FileText className="mt-0.5 shrink-0 text-blue-700" size={16} />
                        <span className="truncate">{document.name}</span>
                      </Link>
                      <span className="text-slate-600">{getDocumentCategoryLabel(document.category)}</span>
                      <span className="text-slate-500">{formatFileSize(document.file_size)}</span>
                      <span className="truncate text-slate-500">{document.relative_path ?? document.original_name ?? document.name}</span>
                      <span className="text-slate-500">{formatDateTime(document.created_at)}</span>
                      <Link href={`/dashboard/documents/${document.id}/download`} className="inline-flex items-center gap-1 font-medium text-blue-700">
                        <Download size={14} />
                        下载
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
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

            <AdminDangerZone description="删除空文档包只会清理文档包记录，不删除任何文件或 Storage 对象；如果文档包仍包含文件，系统会阻止删除。">
              <div className="space-y-4">
                <p className="text-sm leading-6 text-rose-700">
                  当前文档包包含 {documents.length} 个文件。需要先删除文件后，才能删除文档包记录。
                </p>
                <form action={deleteAction}>
                  <DeleteButton label="删除空文档包" />
                </form>
              </div>
            </AdminDangerZone>
          </aside>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
