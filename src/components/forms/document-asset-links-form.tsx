import { documentAssetRelationTypes } from "@/lib/content-options";
import type { DocumentRelatedOptions } from "./document-related-select";
import { DocumentAssetLinkPicker } from "./document-asset-link-picker";
import { Field, Select, Textarea } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function DocumentAssetLinksForm({
  action,
  relatedOptions,
  returnTo,
  documentIds = [],
  submitLabel = "添加关联",
  pendingLabel = "添加中...",
  includeApplyToDocuments = false,
  applyToDocumentsLabel = "同时同步到包内文件"
}: {
  action: (formData: FormData) => void | Promise<void>;
  relatedOptions: DocumentRelatedOptions;
  returnTo: string;
  documentIds?: string[];
  submitLabel?: string;
  pendingLabel?: string;
  includeApplyToDocuments?: boolean;
  applyToDocumentsLabel?: string;
}) {
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="return_to" value={returnTo} />
      {documentIds.map((documentId) => (
        <input key={documentId} type="hidden" name="document_ids" value={documentId} />
      ))}
      <Field label="关联对象" hint="可多选；添加或移除关联不会移动、重命名或删除 Storage object。">
        <DocumentAssetLinkPicker options={relatedOptions} compact />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="这批文件与所选资产的关系">
          <Select name="asset_relation_type" defaultValue="related">
            {documentAssetRelationTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="备注">
          <Textarea name="asset_note" placeholder="可选：记录关联用途或来源。" />
        </Field>
      </div>
      {includeApplyToDocuments ? (
        <label className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            name="apply_to_documents"
            className="mt-1 size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
          />
          <span>{applyToDocumentsLabel}</span>
        </label>
      ) : null}
      <SubmitButton pendingLabel={pendingLabel} className="px-4 py-2.5">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
