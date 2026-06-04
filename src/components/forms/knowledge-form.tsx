import Link from "next/link";
import type { KnowledgeNoteRecord } from "@/lib/content-types";
import { knowledgeCategories, visibilityOptions } from "@/lib/content-options";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function KnowledgeForm({
  action,
  note,
  projects,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  note?: KnowledgeNoteRecord | null;
  projects: Array<{ id: string; title: string }>;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="标题">
          <TextInput name="title" defaultValue={note?.title} required />
        </Field>
        <Field label="slug">
          <TextInput name="slug" defaultValue={note?.slug} required />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="分类">
          <Select name="category" defaultValue={note?.category ?? knowledgeCategories[0]}>
            {knowledgeCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <Field label="关联项目">
          <Select name="project_id" defaultValue={note?.project_id ?? ""}>
            <option value="">不关联项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="摘要">
        <Textarea name="excerpt" defaultValue={note?.excerpt ?? ""} />
      </Field>
      <Field label="Markdown 正文">
        <Textarea name="content" className="min-h-72 font-mono" defaultValue={note?.content ?? ""} />
      </Field>
      <Field label="标签" hint="用逗号或换行分隔">
        <Textarea name="tags" defaultValue={note?.tags.join("\n")} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="权限">
          <Select name="visibility" defaultValue={note?.visibility ?? "private"}>
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox name="is_featured" label="设为精选内容" defaultChecked={note?.is_featured} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={note ? `/dashboard/knowledge/${note.id}` : "/dashboard/knowledge"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
