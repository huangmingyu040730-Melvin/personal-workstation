import { Download, FileText } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { formatDateTime, formatFileSize } from "@/lib/format";
import type { PublicDocumentAttachment } from "@/lib/queries/public-document-attachments";

export function PublicDocumentAttachmentsPanel({
  attachments,
  title = "公开附件",
  description = "仅展示已显式设为公开、且关联到当前公开内容的文件。"
}: {
  attachments: PublicDocumentAttachment[];
  title?: string;
  description?: string;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="group flex flex-col gap-3 rounded-lg border border-stone-200 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <FileText size={17} />
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-6 text-navy-950">{attachment.name}</p>
                  {attachment.original_name && attachment.original_name !== attachment.name ? (
                    <p className="mt-0.5 break-words text-xs leading-5 text-stone-500">{attachment.original_name}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                    <span>{attachment.category_label}</span>
                    {attachment.relation_label ? <span>{attachment.relation_label}</span> : null}
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>{formatDateTime(attachment.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            <a
              href={attachment.download_href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <Download size={15} className="transition group-hover:translate-y-0.5" />
              下载
            </a>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-stone-500">
        下载会按需生成短时链接；页面不会公开 Storage 路径或永久文件地址。
      </p>
    </Card>
  );
}
