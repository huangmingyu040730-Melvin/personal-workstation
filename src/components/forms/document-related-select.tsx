import { documentRelatedTypes } from "@/lib/content-options";
import type { DocumentRelatedType } from "@/lib/content-types";
import { Field, Select } from "./form-fields";

export type DocumentRelatedOptions = {
  publications: Array<{ id: string; title: string }>;
  projects: Array<{ id: string; title: string }>;
  knowledgeNotes: Array<{ id: string; title: string }>;
  skills: Array<{ id: string; title: string }>;
};

export function getDocumentRelatedKey(relatedType: DocumentRelatedType | null | undefined, relatedId: string | null | undefined) {
  return relatedType && relatedId ? `${relatedType}:${relatedId}` : "";
}

export function DocumentRelatedSelect({
  defaultRelatedType,
  defaultRelatedId,
  options,
  hint = "可选。关联类型与对象绑定在同一个选项中，避免误选。"
}: {
  defaultRelatedType?: DocumentRelatedType | null;
  defaultRelatedId?: string | null;
  options: DocumentRelatedOptions;
  hint?: string;
}) {
  return (
    <Field label="关联对象" hint={hint}>
      <Select name="related_key" defaultValue={getDocumentRelatedKey(defaultRelatedType, defaultRelatedId)}>
        <option value="">不关联对象</option>
        <optgroup label={documentRelatedTypes.find((type) => type.value === "publication")?.label}>
          {options.publications.map((publication) => (
            <option key={publication.id} value={`publication:${publication.id}`}>{publication.title}</option>
          ))}
        </optgroup>
        <optgroup label={documentRelatedTypes.find((type) => type.value === "project")?.label}>
          {options.projects.map((project) => (
            <option key={project.id} value={`project:${project.id}`}>{project.title}</option>
          ))}
        </optgroup>
        <optgroup label={documentRelatedTypes.find((type) => type.value === "knowledge")?.label}>
          {options.knowledgeNotes.map((note) => (
            <option key={note.id} value={`knowledge:${note.id}`}>{note.title}</option>
          ))}
        </optgroup>
        <optgroup label={documentRelatedTypes.find((type) => type.value === "skill")?.label}>
          {options.skills.map((skill) => (
            <option key={skill.id} value={`skill:${skill.id}`}>{skill.title}</option>
          ))}
        </optgroup>
      </Select>
    </Field>
  );
}
