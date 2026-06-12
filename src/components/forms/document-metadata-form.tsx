import { AdminFormSection } from "@/components/admin-ui";
import { documentCategories } from "@/lib/content-options";
import type { DocumentWithRelation } from "@/lib/content-types";
import { Field, Select, TextInput } from "./form-fields";
import { DocumentRelatedSelect, type DocumentRelatedOptions } from "./document-related-select";
import { SubmitButton } from "./submit-button";

export function DocumentMetadataForm({
  action,
  document,
  relatedOptions
}: {
  action: (formData: FormData) => void | Promise<void>;
  document: DocumentWithRelation;
  relatedOptions: DocumentRelatedOptions;
}) {
  return (
    <form action={action}>
      <AdminFormSection
        title="编辑文件信息"
        description="只修改后台 metadata，不移动、不重命名 Storage object。"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="文件显示名称">
            <TextInput name="name" defaultValue={document.name} required />
          </Field>
          <Field label="文件分类">
            <Select name="category" defaultValue={document.category}>
              {documentCategories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5">
          <DocumentRelatedSelect
            defaultRelatedType={document.related_type}
            defaultRelatedId={document.related_id}
            options={relatedOptions}
            hint="可解除关联，或改为关联到 Publication、Project、Knowledge、Skill。"
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          文件仍然是私密附件。即使关联到 public Project / Publication / Knowledge / Skill，也不会在公开页面展示下载入口。Skill 包只作为文件存储，不执行、不解析、不安装。
        </p>
        <div className="mt-5">
          <SubmitButton pendingLabel="保存中...">保存文件信息</SubmitButton>
        </div>
      </AdminFormSection>
    </form>
  );
}
