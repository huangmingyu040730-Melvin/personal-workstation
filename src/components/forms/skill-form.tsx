import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import type { SkillRecord } from "@/lib/content-types";
import { skillCategories, skillPlatforms, skillStatuses, visibilityOptions } from "@/lib/content-options";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function SkillForm({
  action,
  skill,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  skill?: SkillRecord | null;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <AdminFormSection title="基本信息" description="定义 Skill 名称、分类、状态、平台与简短描述。">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Skill 名称">
          <TextInput name="name" defaultValue={skill?.name} required />
        </Field>
        <Field label="slug">
          <TextInput name="slug" defaultValue={skill?.slug} required />
        </Field>
      </div>
      <Field label="简短描述">
        <Textarea name="description" defaultValue={skill?.description} required />
      </Field>
      <div className="grid gap-5 md:grid-cols-3">
        <Field label="分类">
          <Select name="category" defaultValue={skill?.category ?? skillCategories[0]}>
            {skillCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <Field label="状态">
          <Select name="status" defaultValue={skill?.status ?? "idea"}>
            {skillStatuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="当前版本">
          <TextInput name="current_version" defaultValue={skill?.current_version ?? ""} placeholder="v1.0.0" />
        </Field>
      </div>
      <Field label="使用平台">
        <div className="flex flex-wrap gap-2">
          {skillPlatforms.map((platform) => (
            <Checkbox key={platform} name="platforms" value={platform} label={platform} defaultChecked={skill?.platforms.includes(platform)} />
          ))}
        </div>
      </Field>
      </AdminFormSection>
      <AdminFormSection title="输入 / 输出 / 使用指南" description="说明 Skill 适合接收什么材料、产出什么结果，以及如何使用。">
      <Field label="详细说明 Markdown">
        <Textarea name="content" className="min-h-44 font-mono" defaultValue={skill?.content ?? ""} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="输入内容说明">
          <Textarea name="input_description" defaultValue={skill?.input_description ?? ""} />
        </Field>
        <Field label="输出内容说明">
          <Textarea name="output_description" defaultValue={skill?.output_description ?? ""} />
        </Field>
      </div>
      <Field label="使用指南 Markdown">
        <Textarea name="usage_guide" className="min-h-44 font-mono" defaultValue={skill?.usage_guide ?? ""} />
      </Field>
      </AdminFormSection>
      <AdminFormSection title="SKILL.md 与仓库" description="沉淀可复用 Skill 文档或公开仓库链接。">
      <Field label="SKILL.md 文本内容">
        <Textarea name="skill_md_content" className="min-h-56 font-mono" defaultValue={skill?.skill_md_content ?? ""} />
      </Field>
      <Field label="GitHub 仓库链接">
        <TextInput name="repository_url" type="url" defaultValue={skill?.repository_url ?? ""} />
      </Field>
      </AdminFormSection>
      <AdminFormSection title="展示设置" description="控制 Skill 的公开范围和首页精选展示。">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="权限">
          <Select name="visibility" defaultValue={skill?.visibility ?? "private"}>
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox name="is_featured" label="设为精选公开内容" defaultChecked={skill?.is_featured} />
        </div>
      </div>
      </AdminFormSection>
      {!skill ? (
        <AdminFormSection title="初始版本记录" description="创建 Skill 时可以同时生成第一条版本记录。">
          <Checkbox name="create_initial_version" label="创建 Skill 时同时生成第一条版本记录" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="版本说明">
              <Textarea name="version_notes" />
            </Field>
            <Field label="发布时间">
              <TextInput name="version_released_at" type="datetime-local" />
            </Field>
          </div>
        </AdminFormSection>
      ) : null}
      {!skill ? (
        <p className="text-sm leading-6 text-slate-500">
          需要上传附件时，可以先保存当前内容，系统会自动跳转到文件中心并预选当前 Skill。文件仍为私密附件，不会在公开页面展示。Skill 包只作为私密文件存储，不执行、不解析、不安装。
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton name="after_create" value="detail">保存</SubmitButton>
        {!skill ? (
          <>
            <SubmitButton name="after_create" value="upload_single" variant="secondary">
              保存并上传 Skill 文档
            </SubmitButton>
            <SubmitButton name="after_create" value="upload_batch" variant="secondary">
              保存并上传 Skill 包 / 文件夹
            </SubmitButton>
          </>
        ) : null}
        <Link href={skill ? `/dashboard/skills/${skill.id}` : "/dashboard/skills"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
