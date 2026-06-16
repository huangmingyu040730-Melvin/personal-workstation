"use client";

import Link from "next/link";
import { Download, Eye, FileText, Link2, LockKeyhole, MoveRight, Trash2, Unlink } from "lucide-react";
import { useState } from "react";
import { addDocumentAssetLinksAction, bulkDeleteDocumentsAction, bulkRemoveDocumentAssetLinksAction, bulkUpdateDocumentRelationsAction, bulkUpdateDocumentVisibilityAction } from "@/actions/documents";
import { DocumentRelationChips } from "@/components/documents/document-relation-chips";
import { DocumentVisibilityBadge } from "@/components/documents/document-visibility-badge";
import { documentAssetRelationTypes, getDocumentCategoryLabel } from "@/lib/content-options";
import type { DocumentWithRelation } from "@/lib/content-types";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DocumentAssetLinkPicker } from "./document-asset-link-picker";
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
    ? "grid-cols-[44px_minmax(240px,1.35fr)_130px_96px_minmax(180px,0.72fr)_minmax(260px,0.95fr)_150px_96px_96px]"
    : "grid-cols-[44px_minmax(240px,1.35fr)_130px_96px_minmax(220px,0.9fr)_minmax(260px,0.95fr)_150px_96px]";
  const hiddenSelectedInputs = selectedDocumentIds.map((documentId) => (
    <input key={documentId} type="hidden" name="document_ids" value={documentId} />
  ));

  return (
    <div>
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <p className="text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-950">已选择 {selectedCount} 个文件。</span>
            {" "}选择文件后可批量添加关联、移除关联、设置公开性、下载 zip 或删除；关联和权限操作都不会移动 Storage object。
          </p>
          <div className="flex flex-wrap gap-2">
            <details className="group relative">
              <summary className={cn("inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold", selectedCount > 0 ? "border-blue-200 bg-white text-blue-700 hover:bg-blue-50" : "border-slate-200 bg-white text-slate-400")}>
                <Link2 size={15} />
                添加关联
              </summary>
              <div className="fixed left-4 right-4 top-20 z-20 max-h-[72vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-[min(92vw,640px)]">
                <form action={addDocumentAssetLinksAction} className="space-y-3">
                  <input type="hidden" name="return_to" value={returnTo} />
                  {hiddenSelectedInputs}
                  <DocumentAssetLinkPicker options={relatedOptions} disabled={selectedCount === 0} compact />
                  <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
                    <select aria-label="这批文件与所选资产的关系" name="asset_relation_type" defaultValue="related" disabled={selectedCount === 0} className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                      {documentAssetRelationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    <input name="asset_note" placeholder="可选备注" disabled={selectedCount === 0} className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
                  </div>
                  <SubmitButton pendingLabel="添加中..." disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                    <Link2 size={15} />
                    批量添加关联
                  </SubmitButton>
                </form>
              </div>
            </details>

            <details className="group relative">
              <summary className={cn("inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold", selectedCount > 0 ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700" : "border-slate-200 bg-white text-slate-400")}>
                <Unlink size={15} />
                移除关联
              </summary>
              <div className="fixed left-4 right-4 top-20 z-20 max-h-[72vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-[min(92vw,520px)]">
                <form action={bulkRemoveDocumentAssetLinksAction} className="space-y-3">
                  <input type="hidden" name="return_to" value={returnTo} />
                  {hiddenSelectedInputs}
                  <DocumentRelatedSelect options={relatedOptions} hint="移除选中文件中匹配该对象的关联；其他关联保留。" />
                  <label className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                    <input type="checkbox" name="clear_confirm" value="yes" className="mt-0.5 size-4 rounded border-amber-300 text-amber-700 focus:ring-amber-200" />
                    <span>如需清空选中文件全部关联，请先勾选确认；指定移除不需要勾选。</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton name="remove_scope" value="specific" pendingLabel="移除中..." variant="secondary" disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                      <Unlink size={15} />
                      移除指定关联
                    </SubmitButton>
                    <SubmitButton name="remove_scope" value="all" pendingLabel="清空中..." variant="secondary" disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                      清空全部关联
                    </SubmitButton>
                  </div>
                </form>
              </div>
            </details>

            <details className="group relative">
              <summary className={cn("inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold", selectedCount > 0 ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700" : "border-slate-200 bg-white text-slate-400")}>
                <Eye size={15} />
                设置公开性
              </summary>
              <div className="fixed left-4 right-4 top-20 z-20 max-h-[72vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-[min(92vw,460px)]">
                <form action={bulkUpdateDocumentVisibilityAction} className="space-y-3">
                  <input type="hidden" name="return_to" value={returnTo} />
                  {hiddenSelectedInputs}
                  <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                    公开文件会在相关公开内容页面展示，并可被访客下载。请确认文件不含敏感信息；Storage object 不会移动，页面不会输出 Storage 路径或 signed URL。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton name="visibility" value="public" pendingLabel="设置中..." disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                      <Eye size={15} />
                      设为公开
                    </SubmitButton>
                    <SubmitButton name="visibility" value="private" pendingLabel="设置中..." variant="secondary" disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                      <LockKeyhole size={15} />
                      设为私密
                    </SubmitButton>
                  </div>
                </form>
              </div>
            </details>

            <form method="post" action="/dashboard/documents/download-zip">
              <input type="hidden" name="return_to" value={returnTo} />
              {hiddenSelectedInputs}
              <SubmitButton variant="secondary" pendingLabel="zip 生成中..." disabled={selectedCount === 0} className="gap-2 px-3 py-2">
                <Download size={15} />
                下载 zip
              </SubmitButton>
            </form>

            <details className="group relative">
              <summary className={cn("inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold", selectedCount > 0 ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50" : "border-slate-200 bg-white text-slate-400")}>
                <Trash2 size={15} />
                删除
              </summary>
              <div className="fixed left-4 right-4 top-20 z-20 max-h-[72vh] overflow-y-auto rounded-2xl border border-rose-100 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-[min(92vw,420px)]">
                <form action={bulkDeleteDocumentsAction} className="space-y-3">
                  <input type="hidden" name="return_to" value={returnTo} />
                  {hiddenSelectedInputs}
                  <p className="text-xs leading-5 text-rose-700">删除会清理数据库记录和 Storage object，此操作不可撤销。</p>
                  <label className="flex items-start gap-2 text-xs leading-5 text-slate-700">
                    <input type="checkbox" name="delete_confirm" value="yes" className="mt-0.5 size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-200" />
                    <span>我确认删除选中文件及其 Storage object</span>
                  </label>
                  <SubmitButton variant="danger" pendingLabel="删除中..." disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                    <Trash2 size={15} />
                    删除选中文件
                  </SubmitButton>
                </form>
              </div>
            </details>

            <details className="group relative">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 hover:border-blue-200 hover:text-blue-700">
                高级主关联
              </summary>
              <div className="fixed left-4 right-4 top-20 z-20 max-h-[72vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-none sm:w-[min(92vw,520px)]">
                <form action={bulkUpdateDocumentRelationsAction} className="space-y-3">
                  <input type="hidden" name="return_to" value={returnTo} />
                  {hiddenSelectedInputs}
                  <DocumentRelatedSelect options={relatedOptions} hint="兼容旧字段：设置或清空 legacy primary relation；不会限制多关联。" />
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton name="bulk_action" value="move" pendingLabel="设置中..." disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                      <MoveRight size={15} />
                      设置主关联
                    </SubmitButton>
                    <SubmitButton name="bulk_action" value="unlink" pendingLabel="清空中..." variant="secondary" disabled={selectedCount === 0} className="gap-2 px-4 py-2.5">
                      清空主关联
                    </SubmitButton>
                  </div>
                </form>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <label className="inline-flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label="选择全部文件"
              className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
            />
            全选
          </label>
          <span>{documents.length} 个文件</span>
        </div>

        {documents.map((document) => (
          <article key={document.id} className="rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(document.id)}
                onChange={() => toggleDocument(document.id)}
                aria-label={`选择文件：${document.name}`}
                className="mt-1 size-4 shrink-0 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/documents/${document.id}`} className="flex min-w-0 gap-2 font-medium text-slate-900 hover:text-blue-700">
                  <FileText className="mt-0.5 shrink-0 text-blue-700" size={16} />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {document.name}
                  </span>
                </Link>
                {document.relative_path ? (
                  <p className="mt-1 text-xs leading-5 text-slate-400 [overflow-wrap:anywhere]">{document.relative_path}</p>
                ) : null}
              </div>
              {mode === "documents" ? <DocumentVisibilityBadge visibility={document.visibility} /> : null}
            </div>

            <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-500">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <span className="font-medium text-slate-700">{getDocumentCategoryLabel(document.category)}</span>
                <span>{formatFileSize(document.file_size)}</span>
                <span>{formatDateTime(document.created_at)}</span>
              </div>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <span className="font-medium text-slate-700">{mode === "documents" ? "文档包：" : "相对路径："}</span>
                {mode === "documents" ? (
                  document.collection ? (
                    <Link href={`/dashboard/documents/collections/${document.collection.id}`} className="text-blue-700 hover:text-blue-900">
                      {document.collection.title}
                    </Link>
                  ) : (
                    <span>未加入文档包</span>
                  )
                ) : (
                  <span>{document.relative_path ?? document.original_name ?? document.name}</span>
                )}
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-700">关联对象</span>
                <DocumentRelationChips relations={document.relations} compact />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <Link href={`/dashboard/documents/${document.id}/download`} className="inline-flex items-center gap-1 font-medium text-blue-700">
                <Download size={14} />
                下载
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
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
            <DocumentRelationChips relations={document.relations} compact />
            <span className="text-slate-500">{formatDateTime(document.created_at)}</span>
            {mode === "documents" ? <DocumentVisibilityBadge visibility={document.visibility} /> : null}
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
