import Link from "next/link";
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
      <Field label="SKILL.md 文本内容">
        <Textarea name="skill_md_content" className="min-h-56 font-mono" defaultValue={skill?.skill_md_content ?? ""} />
      </Field>
      <Field label="GitHub 仓库链接">
        <TextInput name="repository_url" type="url" defaultValue={skill?.repository_url ?? ""} />
      </Field>
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
      {!skill ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox name="create_initial_version" label="创建 Skill 时同时生成第一条版本记录" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="版本说明">
              <Textarea name="version_notes" />
            </Field>
            <Field label="发布时间">
              <TextInput name="version_released_at" type="datetime-local" />
            </Field>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={skill ? `/skills/${skill.id}` : "/skills"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}
