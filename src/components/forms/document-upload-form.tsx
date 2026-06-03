import Link from "next/link";
import type { ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import { documentCategories, documentRelatedTypes } from "@/lib/content-options";
import { getDocumentAcceptAttribute, MAX_DOCUMENT_FILE_SIZE } from "@/lib/storage/documents";
import { formatFileSize } from "@/lib/format";
import { ErrorNotice, Field, Select, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function DocumentUploadForm({
  action,
  projects,
  publications,
  skills,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  projects: Pick<ProjectRecord, "id" | "title">[];
  publications: Pick<PublicationRecord, "id" | "title">[];
  skills: Pick<SkillRecord, "id" | "name">[];
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <Field label="选择文件" hint={`支持 PDF、Office、Markdown、文本、图片与 CSV，最大 ${formatFileSize(MAX_DOCUMENT_FILE_SIZE)}。`}>
        <input
          name="file"
          type="file"
          accept={getDocumentAcceptAttribute()}
          required
          className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-200"
        />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="文件显示名称" hint="留空时将使用清理后的原文件名。">
          <TextInput name="name" placeholder="例如 私募产品比较报告.pdf" />
        </Field>
        <Field label="文件分类">
          <Select name="category" defaultValue="research_material">
            {documentCategories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="关联类型">
          <Select name="related_type" defaultValue="">
            <option value="">不关联</option>
            {documentRelatedTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="关联对象">
          <Select name="related_id" defaultValue="">
            <option value="">不关联对象</option>
            <optgroup label="学术成果">
              {publications.map((publication) => (
                <option key={publication.id} value={publication.id}>{publication.title}</option>
              ))}
            </optgroup>
            <optgroup label="研究项目">
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </optgroup>
            <optgroup label="Skill">
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </optgroup>
          </Select>
        </Field>
      </div>
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
        文件权限固定为私密。即使关联到公开成果，附件也只允许管理员通过短时链接下载。
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="上传中...">上传文件</SubmitButton>
        <Link href="/documents" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
