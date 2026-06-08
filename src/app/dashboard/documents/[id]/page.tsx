import Link from "next/link";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteDocumentAction } from "@/actions/documents";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getDocumentCategoryLabel, getDocumentRelatedTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getDocumentById } from "@/lib/queries/documents";

export default async function DocumentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  const error = getFormError(query);

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
        <AdminSecurityNote>文件始终保存在 private bucket 中。下载操作会生成短时链接，公开站点不会展示文件路径或下载入口。</AdminSecurityNote>
        <div className="grid gap-5 xl:grid-cols-[0.7fr_0.3fr]">
        <Card>
          <CardHeader title="文件元数据" />
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件分类</dt><dd className="mt-1 font-medium text-slate-900">{getDocumentCategoryLabel(document.category)}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件类型</dt><dd className="mt-1 break-all font-medium text-slate-900">{document.mime_type}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">文件大小</dt><dd className="mt-1 font-medium text-slate-900">{formatFileSize(document.file_size)}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">权限</dt><dd className="mt-1"><VisibilityBadge visibility={document.visibility} /></dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">上传时间</dt><dd className="mt-1 font-medium text-slate-900">{formatDateTime(document.created_at)}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-slate-500">更新时间</dt><dd className="mt-1 font-medium text-slate-900">{formatDateTime(document.updated_at)}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardHeader title="关联对象" />
          {document.related ? (
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm text-blue-700">{getDocumentRelatedTypeLabel(document.related.type)}</p>
              <Link href={document.related.href} className="mt-1 block font-semibold text-slate-950 hover:text-blue-700">{document.related.title}</Link>
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">未关联任何项目、成果或 Skill。</p>
          )}
        </Card>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
