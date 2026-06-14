import { AdminFormSection } from "@/components/admin-ui";
import { documentCategories, visibilityOptions } from "@/lib/content-options";
import type { DocumentWithRelation } from "@/lib/content-types";
import { Field, Select, TextInput } from "./form-fields";
import { DocumentRelatedSelect, type DocumentRelatedOptions } from "./document-related-select";
import { SubmitButton } from "./submit-button";

const documentVisibilityOptions = visibilityOptions.filter((option) => option.value !== "restricted");

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
        description="只修改后台 metadata 和 legacy primary relation，不移动、不重命名 Storage object；多关联请使用关联资产区域。"
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
          <Field
            label="文件权限"
            hint="只有 public 文件，且关联到 public Project / Publication / Knowledge / Skill 时，才会在公开页面显示下载入口。"
          >
            <Select name="visibility" defaultValue={document.visibility}>
              {documentVisibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5">
          <DocumentRelatedSelect
            defaultRelatedType={document.related_type}
            defaultRelatedId={document.related_id}
            options={relatedOptions}
            hint="兼容字段：可设置一个主关联作为旧流程 fallback，不会限制文件的多关联。"
          />
        </div>
        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          公开文件会在相关公开内容页面展示，并可被访客下载。请确认文件不含敏感信息。文件仍保存在 private bucket；页面不会输出 Storage 路径或 signed URL。Skill 包只作为文件存储，不执行、不解析、不安装。
        </p>
        <div className="mt-5">
          <SubmitButton pendingLabel="保存中...">保存文件信息</SubmitButton>
        </div>
      </AdminFormSection>
    </form>
  );
}
