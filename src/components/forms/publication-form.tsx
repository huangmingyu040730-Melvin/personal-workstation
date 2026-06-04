import Link from "next/link";
import type { ProjectRecord, PublicationRecord } from "@/lib/content-types";
import { publicationTypes, visibilityOptions } from "@/lib/content-options";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function PublicationForm({
  action,
  publication,
  projects,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  publication?: PublicationRecord | null;
  projects: Pick<ProjectRecord, "id" | "title">[];
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="成果标题">
          <TextInput name="title" defaultValue={publication?.title} required />
        </Field>
        <Field label="slug" hint="小写字母、数字和连字符，例如 factor-report-2026">
          <TextInput name="slug" defaultValue={publication?.slug} required />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Field label="成果类型">
          <Select name="publication_type" defaultValue={publication?.publication_type ?? "research_report"}>
            {publicationTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="发布日期">
          <TextInput name="published_on" type="date" defaultValue={publication?.published_on ?? ""} />
        </Field>
        <Field label="关联研究项目">
          <Select name="project_id" defaultValue={publication?.project_id ?? ""}>
            <option value="">不关联项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="简介">
        <Textarea name="summary" defaultValue={publication?.summary} required />
      </Field>
      <Field label="摘要 / Abstract" hint="支持安全 Markdown 文本，不渲染原始 HTML。">
        <Textarea name="abstract" defaultValue={publication?.abstract ?? ""} />
      </Field>
      <Field label="标签" hint="用逗号或换行分隔">
        <Textarea name="tags" defaultValue={publication?.tags.join("\n")} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="权限">
          <Select name="visibility" defaultValue={publication?.visibility ?? "private"}>
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox name="is_featured" label="设为精选成果" defaultChecked={publication?.is_featured} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={publication ? `/dashboard/publications/${publication.id}` : "/dashboard/publications"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
