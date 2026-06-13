import { documentAssetRelationTypes, documentRelatedTypes } from "@/lib/content-options";
import type { DocumentRelatedOptions } from "./document-related-select";
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
      <Field label="关联对象" hint="可多选；同一对象可用不同关系语义重复关联。">
        <select
          name="asset_links"
          multiple
          className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        >
          <optgroup label={documentRelatedTypes.find((type) => type.value === "publication")?.label}>
            {relatedOptions.publications.map((publication) => (
              <option key={publication.id} value={`publication:${publication.id}`}>{publication.title}</option>
            ))}
          </optgroup>
          <optgroup label={documentRelatedTypes.find((type) => type.value === "project")?.label}>
            {relatedOptions.projects.map((project) => (
              <option key={project.id} value={`project:${project.id}`}>{project.title}</option>
            ))}
          </optgroup>
          <optgroup label={documentRelatedTypes.find((type) => type.value === "knowledge")?.label}>
            {relatedOptions.knowledgeNotes.map((note) => (
              <option key={note.id} value={`knowledge:${note.id}`}>{note.title}</option>
            ))}
          </optgroup>
          <optgroup label={documentRelatedTypes.find((type) => type.value === "skill")?.label}>
            {relatedOptions.skills.map((skill) => (
              <option key={skill.id} value={`skill:${skill.id}`}>{skill.title}</option>
            ))}
          </optgroup>
        </select>
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="关系语义">
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
