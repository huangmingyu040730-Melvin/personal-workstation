"use client";

import Link from "next/link";
import { Download, FileText, MoveRight, Trash2, Unlink } from "lucide-react";
import { useState } from "react";
import { bulkDeleteDocumentsAction, bulkUpdateDocumentRelationsAction } from "@/actions/documents";
import { VisibilityBadge } from "@/components/badge";
import { getDocumentCategoryLabel, getDocumentRelatedTypeLabel } from "@/lib/content-options";
import type { DocumentWithRelation } from "@/lib/content-types";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DocumentRelatedSelect, type DocumentRelatedOptions } from "./document-related-select";
import { SubmitButton } from "./submit-button";

type DocumentBulkActionsFormProps = {
  documents: DocumentWithRelation[];
  relatedOptions: DocumentRelatedOptions;
  returnTo: string;
  mode?: "documents" | "collection";
};

export function DocumentBulkActionsForm({
  documents,
  relatedOptions,
  returnTo,
  mode = "documents"
}: DocumentBulkActionsFormProps) {
  const allDocumentIds = documents.map((document) => document.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectedDocumentIds = Array.from(selectedIds);
  const selectedCount = selectedIds.size;
  const allSelected = allDocumentIds.length > 0 && selectedCount === allDocumentIds.length;

  function toggleDocument(documentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((current) => {
      if (current.size === allDocumentIds.length) {
        return new Set();
      }

      return new Set(allDocumentIds);
    });
  }

  const gridClass = mode === "documents"
    ? "grid-cols-[0.24fr_1.28fr_0.5fr_0.45fr_0.72fr_0.72fr_0.58fr_0.38fr_0.42fr]"
    : "grid-cols-[0.24fr_1.28fr_0.52fr_0.45fr_0.82fr_0.72fr_0.58fr_0.42fr]";

  return (
    <div>
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">已选择 {selectedCount} 个文件</p>
            <p>
              批量移动只修改文件 metadata，不会移动或重命名 Supabase Storage object，不会删除文件，也不会修改文档包归属。
            </p>
            <p className="text-xs text-slate-500">
              私密附件仍不会在公开页面展示下载入口；Skill 包只作为文件存储，不执行、不解析、不安装。
            </p>
          </div>
          <div className="space-y-4">
            <form action={bulkUpdateDocumentRelationsAction} className="space-y-3">
              <input type="hidden" name="return_to" value={returnTo} />
              {selectedDocumentIds.map((documentId) => (
                <input key={documentId} type="hidden" name="document_ids" value={documentId} />
              ))}
              <DocumentRelatedSelect
                options={relatedOptions}
                hint="批量移动时选择目标对象；批量解除关联会忽略此选择。"
              />
              <div className="flex flex-wrap gap-2">
                <SubmitButton name="bulk_action" value="move" pendingLabel="批量移动中..." disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                  <MoveRight size={16} />
                  批量移动到关联对象
                </SubmitButton>
                <SubmitButton name="bulk_action" value="unlink" pendingLabel="批量解除中..." variant="secondary" disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                  <Unlink size={16} />
                  批量解除关联
                </SubmitButton>
              </div>
            </form>

            <form action={bulkDeleteDocumentsAction} className="rounded-2xl border border-rose-100 bg-white p-4">
              <input type="hidden" name="return_to" value={returnTo} />
              {selectedDocumentIds.map((documentId) => (
                <input key={documentId} type="hidden" name="document_ids" value={documentId} />
              ))}
              <div className="space-y-2 text-xs leading-5 text-rose-700">
                <p className="font-semibold text-rose-950">批量删除选中文件</p>
                <p>将删除选中文件的数据库记录和 Supabase Storage object；不会自动删除文档包本身，文档包可能变为空。</p>
                <p>此操作不可撤销。</p>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700">
                <input
                  type="checkbox"
                  name="delete_confirm"
                  value="yes"
                  className="mt-0.5 size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-200"
                />
                <span>我确认删除选中的文件及其 Storage object</span>
              </label>
              <SubmitButton
                variant="danger"
                pendingLabel="批量删除中..."
                disabled={selectedCount === 0}
                className="mt-3 gap-2 px-4 py-2.5"
              >
                <Trash2 size={16} />
                批量删除选中文件
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className={cn("grid min-w-[1120px] gap-3 border-b border-slate-100 bg-white px-5 py-3 text-sm font-medium text-slate-500", gridClass)}>
          <label className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label="选择全部文件"
              className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
            />
          </label>
          <span>文件名</span>
          <span>分类</span>
          <span>大小</span>
          {mode === "documents" ? <span>文档包</span> : <span>相对路径</span>}
          <span>关联对象</span>
          <span>上传时间</span>
          {mode === "documents" ? <span>权限</span> : null}
          <span>操作</span>
        </div>

        {documents.map((document) => (
          <div key={document.id} className={cn("grid min-w-[1120px] gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-blue-50/60 last:border-0", gridClass)}>
            <label className="flex items-start justify-center pt-0.5">
              <input
                type="checkbox"
                checked={selectedIds.has(document.id)}
                onChange={() => toggleDocument(document.id)}
                aria-label={`选择文件：${document.name}`}
                className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
              />
            </label>
            <Link href={`/dashboard/documents/${document.id}`} className="flex min-w-0 gap-2 font-medium text-slate-900 hover:text-blue-700">
              <FileText className="mt-0.5 shrink-0 text-blue-700" size={16} />
              <span className="min-w-0">
                <span className="block truncate">{document.name}</span>
                {mode === "documents" && document.relative_path ? (
                  <span className="mt-0.5 block truncate text-xs font-normal text-slate-400">{document.relative_path}</span>
                ) : null}
              </span>
            </Link>
            <span className="text-slate-600">{getDocumentCategoryLabel(document.category)}</span>
            <span className="text-slate-500">{formatFileSize(document.file_size)}</span>
            {mode === "documents" ? (
              <span className="truncate text-slate-500">
                {document.collection ? (
                  <Link href={`/dashboard/documents/collections/${document.collection.id}`} className="text-blue-700 hover:text-blue-900">
                    {document.collection.title}
                  </Link>
                ) : (
                  "未加入文档包"
                )}
              </span>
            ) : (
              <span className="truncate text-slate-500">{document.relative_path ?? document.original_name ?? document.name}</span>
            )}
            <span className="truncate text-slate-500">{document.related?.title ?? getDocumentRelatedTypeLabel(document.related_type)}</span>
            <span className="text-slate-500">{formatDateTime(document.created_at)}</span>
            {mode === "documents" ? <VisibilityBadge visibility={document.visibility} /> : null}
            <Link href={`/dashboard/documents/${document.id}/download`} className="inline-flex items-center gap-1 font-medium text-blue-700">
              <Download size={14} />
              下载
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
