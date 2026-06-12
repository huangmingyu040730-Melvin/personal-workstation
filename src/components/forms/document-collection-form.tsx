import { AdminFormSection } from "@/components/admin-ui";
import { documentCollectionTypes } from "@/lib/content-options";
import type { DocumentCollectionWithRelation } from "@/lib/content-types";
import { Field, Select, Textarea, TextInput } from "./form-fields";
import { DocumentRelatedSelect, type DocumentRelatedOptions } from "./document-related-select";
import { SubmitButton } from "./submit-button";

export function DocumentCollectionForm({
  action,
  collection,
  relatedOptions
}: {
  action: (formData: FormData) => void | Promise<void>;
  collection: DocumentCollectionWithRelation;
  relatedOptions: DocumentRelatedOptions;
}) {
  return (
    <form action={action}>
      <AdminFormSection
        title="编辑文档包信息"
        description="只修改文档包 metadata，不会批量同步包内文件关联对象。"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="文档包名称">
            <TextInput name="title" defaultValue={collection.title} required />
          </Field>
          <Field label="文档包类型">
            <Select name="collection_type" defaultValue={collection.collection_type}>
              {documentCollectionTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="描述">
            <Textarea name="description" defaultValue={collection.description ?? ""} />
          </Field>
        </div>
        <div className="mt-5">
          <DocumentRelatedSelect
            defaultRelatedType={collection.related_type}
            defaultRelatedId={collection.related_id}
            options={relatedOptions}
            hint="可解除关联，或改为关联到 Publication、Project、Knowledge、Skill。"
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          文档包和包内文件允许拥有不同关联对象；文件级关联请在文件详情页单独调整。附件仍保持 private，关联公开内容也不会开放下载入口。Skill 包只作为文件存储，不执行、不解析、不安装。
        </p>
        <div className="mt-5">
          <SubmitButton pendingLabel="保存中...">保存文档包信息</SubmitButton>
        </div>
      </AdminFormSection>
    </form>
  );
}
