import Link from "next/link";
import { ArrowRightLeft, Unlink } from "lucide-react";
import { AdminFormSection } from "@/components/admin-ui";
import { getDocumentRelatedTypeLabel } from "@/lib/content-options";
import type { DocumentCollectionWithRelation } from "@/lib/content-types";
import { DocumentRelatedSelect, type DocumentRelatedOptions } from "./document-related-select";
import { SubmitButton } from "./submit-button";

export function DocumentCollectionSyncForm({
  action,
  collection,
  documentCount,
  relatedOptions
}: {
  action: (formData: FormData) => void | Promise<void>;
  collection: DocumentCollectionWithRelation;
  documentCount: number;
  relatedOptions: DocumentRelatedOptions;
}) {
  return (
    <form action={action}>
      <AdminFormSection
        title="高级：同步主关联"
        description="兼容旧字段的整体迁移工具；多关联请优先使用上方“添加文档包关联”。"
        className="border-blue-100 bg-blue-50/50"
      >
        <div className="rounded-2xl border border-blue-100 bg-white p-4 text-sm leading-6">
          <p className="font-semibold text-slate-900">当前关联对象</p>
          {collection.related ? (
            <p className="mt-1 text-slate-600">
              {getDocumentRelatedTypeLabel(collection.related.type)}：
              <Link href={collection.related.href} className="font-medium text-blue-700 hover:text-blue-900">
                {collection.related.title}
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-slate-500">未关联任何对象。</p>
          )}
        </div>

        {documentCount === 0 ? (
          <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            当前文档包为空，本操作只会修改文档包自身关联。
          </p>
        ) : null}

        <div className="mt-5">
          <DocumentRelatedSelect
            defaultRelatedType={collection.related_type}
            defaultRelatedId={collection.related_id}
            options={relatedOptions}
            hint="整体迁移会把文档包和包内全部文件的 legacy primary relation 同步到同一个对象；整体解除会忽略此选择。"
          />
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-slate-500">
          <p>此操作只修改文档包和包内文件的关联 metadata。</p>
          <p>为保持兼容，会同步写入或清空对应多关联 link rows。</p>
          <p>不会移动、重命名、删除 Storage object，也不会修改文件的 collection_id 或公开附件下载入口。</p>
          <p>Skill 包只作为私密文件存储，不执行、不解析、不安装。</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <SubmitButton name="collection_sync_action" value="sync" pendingLabel="整体迁移中..." className="gap-2 px-4 py-2.5">
            <ArrowRightLeft size={16} />
            整体迁移文档包
          </SubmitButton>
          <SubmitButton name="collection_sync_action" value="unlink" pendingLabel="整体解除中..." variant="secondary" className="gap-2 px-4 py-2.5">
            <Unlink size={16} />
            整体解除关联
          </SubmitButton>
        </div>
      </AdminFormSection>
    </form>
  );
}
