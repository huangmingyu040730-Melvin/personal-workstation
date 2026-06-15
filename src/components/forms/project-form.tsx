import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
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
    <form id="project-form" action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <AdminFormSection title="基本信息" description="用于列表、详情页和公开卡片展示的核心信息。">
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
      </AdminFormSection>
      <AdminFormSection title="状态与进度" description="用于 Dashboard 统计和项目进展展示。">
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
      </AdminFormSection>
      <AdminFormSection title="分类与里程碑" description="标签用于筛选和公开展示，里程碑用于后台管理。">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="标签" hint="用逗号或换行分隔">
          <Textarea name="tags" defaultValue={project?.tags.join("\n")} />
        </Field>
        <Field label="里程碑" hint="用逗号或换行分隔">
          <Textarea name="milestones" defaultValue={project?.milestones.join("\n")} />
        </Field>
      </div>
      </AdminFormSection>
      <AdminFormSection title="研究内容" description="支持公开详情页展示的研究背景、问题与方法。">
      <Field label="研究背景">
        <Textarea name="background" defaultValue={project?.background ?? ""} />
      </Field>
      <Field label="研究问题">
        <Textarea name="research_question" defaultValue={project?.research_question ?? ""} />
      </Field>
      <Field label="研究方法">
        <Textarea name="methodology" defaultValue={project?.methodology ?? ""} />
      </Field>
      </AdminFormSection>
      <AdminFormSection title="展示设置" description="控制内容是否公开、是否进入首页精选区域。">
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
      </AdminFormSection>
      {!project ? (
        <p className="text-sm leading-6 text-slate-500">
          需要上传附件时，可以先保存当前内容，系统会自动跳转到文件中心并预选当前项目。新文件默认私密；如需公开下载，需在文件中心显式设为公开。
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton name="after_create" value="detail">保存</SubmitButton>
        {!project ? (
          <>
            <SubmitButton name="after_create" value="upload_single" variant="secondary">
              保存并上传项目文件
            </SubmitButton>
            <SubmitButton name="after_create" value="upload_batch" variant="secondary">
              保存并上传项目文件夹
            </SubmitButton>
          </>
        ) : null}
        <Link href={project ? `/dashboard/projects/${project.id}` : "/dashboard/projects"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
