import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import { resumeItemTypes } from "@/lib/content-options";
import type { ResumeItemRecord } from "@/lib/content-types";
import type { ResumeRelationOptions } from "@/lib/queries/resume";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function ResumeItemForm({
  action,
  item,
  options,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  item?: ResumeItemRecord | null;
  options: ResumeRelationOptions;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />

      <AdminFormSection title="基本信息" description="用于区分这条素材在简历数据库中的位置和用途。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="素材类型">
            <Select name="item_type" defaultValue={item?.item_type ?? "experience"}>
              {resumeItemTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="素材标题">
            <TextInput name="title" defaultValue={item?.title} placeholder="例如 某研究项目、某段实习经历、Python 数据分析" required />
          </Field>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="机构 / 学校 / 公司">
            <TextInput name="organization" defaultValue={item?.organization ?? ""} />
          </Field>
          <Field label="角色 / 岗位">
            <TextInput name="role_title" defaultValue={item?.role_title ?? ""} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="地点">
            <TextInput name="location" defaultValue={item?.location ?? ""} placeholder="可选，例如 上海、线上、远程" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="时间与排序" description="用于后续生成简历时排序和展示经历时间线。">
        <div className="grid gap-5 md:grid-cols-4">
          <Field label="开始日期">
            <TextInput name="start_date" type="date" defaultValue={item?.start_date ?? ""} />
          </Field>
          <Field label="结束日期">
            <TextInput name="end_date" type="date" defaultValue={item?.end_date ?? ""} />
          </Field>
          <Field label="排序值">
            <TextInput name="sort_order" type="number" min={0} max={9999} defaultValue={item?.sort_order ?? 0} />
          </Field>
          <div className="flex items-end">
            <Checkbox name="is_current" label="至今" defaultChecked={item?.is_current} />
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection title="素材内容" description="bullet 建议写成可复用的成果表达，后续会被简历生成器选择和组合。">
        <Field label="简要概述">
          <Textarea name="summary" defaultValue={item?.summary ?? ""} placeholder="概括这条素材的背景、职责或成果。" />
        </Field>
        <div className="mt-5">
          <Field label="Bullet points" hint="用换行或逗号分隔。建议每条包含行动、方法和结果。">
            <Textarea name="bullets" defaultValue={item?.bullets.join("\n")} className="min-h-40" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="标签与技能" description="用于后续筛选、岗位匹配和简历版本组合。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="技能关键词" hint="用逗号或换行分隔">
            <Textarea name="skills" defaultValue={item?.skills.join("\n")} />
          </Field>
          <Field label="标签" hint="用逗号或换行分隔">
            <Textarea name="tags" defaultValue={item?.tags.join("\n")} />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="关联对象" description="可选。把履历素材和已有研究资产连接起来，方便后续生成简历时追溯来源。">
        <div className="grid gap-5 md:grid-cols-2">
          <RelationSelect label="关联项目" name="related_project_id" value={item?.related_project_id} options={options.projects} />
          <RelationSelect label="关联成果" name="related_publication_id" value={item?.related_publication_id} options={options.publications} />
          <RelationSelect label="关联知识" name="related_knowledge_id" value={item?.related_knowledge_id} options={options.knowledge} />
          <RelationSelect label="关联 Skill" name="related_skill_id" value={item?.related_skill_id} options={options.skills} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="展示设置" description="默认 private。本阶段不会创建公开简历页面。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="权限">
            <Select name="visibility" defaultValue={item?.visibility ?? "private"}>
              <option value="private">私密</option>
              <option value="public">公开</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Checkbox name="is_featured" label="设为重点素材" defaultChecked={item?.is_featured} />
          </div>
        </div>
      </AdminFormSection>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={item ? `/dashboard/resume/${item.id}` : "/dashboard/resume"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}

function RelationSelect({
  label,
  name,
  value,
  options
}: {
  label: string;
  name: string;
  value?: string | null;
  options: Array<{ id: string; title: string }>;
}) {
  return (
    <Field label={label}>
      <Select name={name} defaultValue={value ?? ""}>
        <option value="">不关联</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.title}
          </option>
        ))}
      </Select>
    </Field>
  );
}
