import Link from "next/link";
import type { ProjectRecord } from "@/lib/content-types";
import { projectStatuses, visibilityOptions } from "@/lib/content-options";
import { Field, Select, Textarea, TextInput, Checkbox, ErrorNotice } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function ProjectForm({
  action,
  project,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  project?: ProjectRecord | null;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="项目标题">
          <TextInput name="title" defaultValue={project?.title} required />
        </Field>
        <Field label="slug" hint="小写字母、数字和连字符，例如 index-enhancement-research">
          <TextInput name="slug" defaultValue={project?.slug} required />
        </Field>
      </div>
      <Field label="简介">
        <Textarea name="summary" defaultValue={project?.summary} required />
      </Field>
      <div className="grid gap-5 md:grid-cols-3">
        <Field label="项目状态">
          <Select name="status" defaultValue={project?.status ?? "planning"}>
            {projectStatuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="当前进度">
          <TextInput name="progress" type="number" min={0} max={100} defaultValue={project?.progress ?? 0} required />
        </Field>
        <Field label="开始日期">
          <TextInput name="start_date" type="date" defaultValue={project?.start_date ?? ""} />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="标签" hint="用逗号或换行分隔">
          <Textarea name="tags" defaultValue={project?.tags.join("\n")} />
        </Field>
        <Field label="里程碑" hint="用逗号或换行分隔">
          <Textarea name="milestones" defaultValue={project?.milestones.join("\n")} />
        </Field>
      </div>
      <Field label="研究背景">
        <Textarea name="background" defaultValue={project?.background ?? ""} />
      </Field>
      <Field label="研究问题">
        <Textarea name="research_question" defaultValue={project?.research_question ?? ""} />
      </Field>
      <Field label="研究方法">
        <Textarea name="methodology" defaultValue={project?.methodology ?? ""} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="权限">
          <Select name="visibility" defaultValue={project?.visibility ?? "private"}>
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox name="is_featured" label="设为精选内容" defaultChecked={project?.is_featured} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={project ? `/dashboard/projects/${project.id}` : "/dashboard/projects"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
