"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminFormSection } from "@/components/admin-ui";
import { resumeItemTypes } from "@/lib/content-options";
import type { ResumeItemRecord, ResumeItemType } from "@/lib/content-types";
import type { ResumeRelationOptions } from "@/lib/queries/resume";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

const sectionHints: Record<ResumeItemType, string> = {
  basic: "用于简历顶部个人信息，可覆盖公开 Profile，不会自动进入 About。",
  education: "用于教育经历区块，建议填写学校、学院、专业、学位和核心课程。",
  experience: "用于实习或工作经历区块，建议把职责、方法、成果拆成 bullets。",
  project: "用于项目经历区块，可记录项目背景、方法、工具和个人角色。",
  research: "用于研究经历区块，可记录研究主题、方法和阶段性结论。",
  skill: "用于相关技能区块，适合按技能分类整理。",
  certification: "用于证书区块，记录颁发方和获得时间。",
  award: "用于荣誉奖项区块，记录颁发方和时间。",
  language: "用于语言能力区块，例如英语、普通话或其他语言。",
  other: "用于在校经历、社团经历或其他补充经历。"
};

export function ResumeItemForm({
  action,
  item,
  options,
  error,
  defaultType
}: {
  action: (formData: FormData) => void | Promise<void>;
  item?: ResumeItemRecord | null;
  options: ResumeRelationOptions;
  error?: string;
  defaultType?: ResumeItemType;
}) {
  const initialType = item?.item_type ?? defaultType ?? "experience";
  const [itemType, setItemType] = useState<ResumeItemType>(initialType);
  const details = useMemo(() => normalizeDetails(item?.details), [item?.details]);

  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />

      <AdminFormSection title="素材归类" description="先确定素材属于哪个简历区块，再填写该区块需要的结构化字段。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="素材类型" hint={sectionHints[itemType]}>
            <Select name="item_type" value={itemType} onChange={(event) => setItemType(event.target.value as ResumeItemType)}>
              {resumeItemTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="素材标题">
            <TextInput name="title" defaultValue={item?.title} placeholder="例如 上海财经大学金融学、某券商研究实习、Python 数据分析" required />
          </Field>
        </div>
      </AdminFormSection>

      <TypeSpecificFields itemType={itemType} item={item} details={details} />

      <AdminFormSection title="时间与排序" description="日期会进入打印预览；排序值用于同一区块内的展示顺序。">
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

      <AdminFormSection title="简历正文" description="这里保存可复用的正文表达。打印模板会根据版本里的字段开关决定是否展示。">
        <Field label="简要概述">
          <Textarea name="summary" defaultValue={item?.summary ?? ""} placeholder="一句话概括背景、职责、方法或成果。" />
        </Field>
        <div className="mt-5">
          <Field label="Bullet points" hint="用换行或逗号分隔。建议每条包含行动、方法和结果。">
            <Textarea name="bullets" defaultValue={item?.bullets.join("\n")} className="min-h-40" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="关键词与标签" description="用于后台筛选和版本组合，打印模板默认弱化展示。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="技能关键词" hint="用逗号或换行分隔">
            <Textarea name="skills" defaultValue={item?.skills.join("\n")} />
          </Field>
          <Field label="标签" hint="用逗号或换行分隔">
            <Textarea name="tags" defaultValue={item?.tags.join("\n")} />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="关联对象" description="可选。把履历素材和已有研究资产连接起来，方便后续追溯来源。">
        <div className="grid gap-5 md:grid-cols-2">
          <RelationSelect label="关联项目" name="related_project_id" value={item?.related_project_id} options={options.projects} />
          <RelationSelect label="关联成果" name="related_publication_id" value={item?.related_publication_id} options={options.publications} />
          <RelationSelect label="关联知识" name="related_knowledge_id" value={item?.related_knowledge_id} options={options.knowledge} />
          <RelationSelect label="关联 Skill" name="related_skill_id" value={item?.related_skill_id} options={options.skills} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="展示设置" description="默认 private。本阶段不会创建公开简历页面，也不会把简历私密信息自动同步到 About。">
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

function TypeSpecificFields({ itemType, item, details }: { itemType: ResumeItemType; item?: ResumeItemRecord | null; details: Record<string, string | string[]> }) {
  if (itemType === "basic") {
    return (
      <AdminFormSection title="个人信息字段" description="这些字段只用于简历版本选择和打印预览，不会自动公开到 About。">
        <div className="grid gap-5 md:grid-cols-2">
          <DetailInput label="姓名" name="name" details={details} fallback={item?.title} />
          <DetailInput label="照片 URL" name="photo_url" details={details} placeholder="可选，后续支持头像或照片引用" />
          <DetailInput label="求职 / 研究方向" name="direction" details={details} placeholder="例如 投资研究 / 量化分析" />
          <DetailInput label="性别" name="gender" details={details} />
          <DetailInput label="年龄" name="age" details={details} />
          <DetailInput label="电话" name="phone" details={details} />
          <DetailInput label="邮箱" name="email" details={details} />
          <DetailInput label="所在地" name="location" details={details} fallback={item?.location} />
          <DetailInput label="个人网站 / 链接" name="website" details={details} />
          <DetailInput label="社交链接" name="social_links" details={details} placeholder="例如 GitHub / LinkedIn / 个人主页" />
        </div>
      </AdminFormSection>
    );
  }

  if (itemType === "education") {
    return (
      <AdminFormSection title="教育经历字段" description="贴近中文简历：时间、学校、专业/学位、核心课程和荣誉。">
        <div className="grid gap-5 md:grid-cols-2">
          <DetailInput label="学校" name="school" details={details} fallback={item?.organization} />
          <DetailInput label="学院" name="college" details={details} />
          <DetailInput label="专业" name="major" details={details} />
          <DetailInput label="学位 / 学历" name="degree" details={details} fallback={item?.role_title} />
          <DetailInput label="GPA / 排名" name="gpa" details={details} />
          <DetailInput label="地点" name="location" details={details} fallback={item?.location} />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <DetailTextarea label="核心课程" name="core_courses" details={details} hint="用逗号或换行分隔，打印时会合并为一行。" />
          <DetailTextarea label="荣誉 / 奖学金" name="honors" details={details} />
        </div>
      </AdminFormSection>
    );
  }

  if (itemType === "experience") {
    return (
      <AdminFormSection title="实习 / 工作字段" description="用于顶部时间线和公司岗位信息，bullet 中写具体工作。">
        <div className="grid gap-5 md:grid-cols-2">
          <DetailInput label="公司 / 机构" name="company" details={details} fallback={item?.organization} />
          <DetailInput label="部门" name="department" details={details} />
          <DetailInput label="岗位" name="position" details={details} fallback={item?.role_title} />
          <DetailInput label="业务方向" name="business_area" details={details} />
        </div>
        <div className="mt-5">
          <DetailTextarea label="使用工具 / 方法" name="tools" details={details} hint="例如 Python、Wind、Excel、SQL、因子分析。" />
        </div>
        <div className="mt-5">
          <DetailTextarea label="成果 / 业绩" name="achievements" details={details} />
        </div>
      </AdminFormSection>
    );
  }

  if (itemType === "project" || itemType === "research") {
    return (
      <AdminFormSection title={itemType === "project" ? "项目 / 产品研究字段" : "研究经历字段"} description="用于投研、量化、AI 工作流等项目型经历。">
        <div className="grid gap-5 md:grid-cols-2">
          <DetailInput label="项目名称" name="project_name" details={details} fallback={itemType === "project" ? item?.title : undefined} />
          <DetailInput label="项目角色" name="project_role" details={details} fallback={item?.role_title} />
          <DetailInput label="研究主题" name="research_topic" details={details} fallback={itemType === "research" ? item?.title : undefined} />
          <DetailInput label="研究角色" name="research_role" details={details} />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <DetailTextarea label="背景" name="background" details={details} />
          <DetailTextarea label="方法 / 框架" name="methods" details={details} />
          <DetailTextarea label="工具" name="tools" details={details} />
          <DetailTextarea label="结论 / 产出" name="conclusion" details={details} />
          <DetailTextarea label="成果" name="results" details={details} />
          <DetailTextarea label="关联产出" name="related_outputs" details={details} fallback={arrayOrStringDetail(details, "outputs")} />
        </div>
      </AdminFormSection>
    );
  }

  if (itemType === "skill" || itemType === "language") {
    return (
      <AdminFormSection title="技能字段" description="适合按类别写成简历底部紧凑技能行。">
        <div className="grid gap-5 md:grid-cols-2">
          <DetailInput label="技能分类" name="skill_category" details={details} placeholder="例如 编程与数据分析、金融工具、语言能力" />
          <DetailInput label="熟练度" name="proficiency" details={details} />
          <DetailInput label="语言等级" name="language_level" details={details} />
          <DetailTextarea label="技能条目" name="skill_items" details={details} hint="用逗号或换行分隔。" />
        </div>
      </AdminFormSection>
    );
  }

  if (itemType === "certification" || itemType === "award") {
    return (
      <AdminFormSection title="证书 / 奖项字段" description="用于简历补充区块，保持简洁。">
        <div className="grid gap-5 md:grid-cols-2">
          <DetailInput label={itemType === "award" ? "奖项名称" : "证书名称"} name={itemType === "award" ? "award_name" : "certificate_name"} details={details} fallback={item?.title} />
          <DetailInput label="颁发方" name="issuer" details={details} fallback={item?.organization} />
          <DetailInput label="获得时间" name="issued_at" details={details} placeholder="例如 2026.05" />
          <DetailInput label="有效期" name="valid_until" details={details} />
          <DetailInput label="级别" name="level" details={details} />
        </div>
        <div className="mt-5">
          <DetailTextarea label="说明" name="description" details={details} />
        </div>
      </AdminFormSection>
    );
  }

  return (
    <AdminFormSection title="在校 / 其他经历字段" description="用于学生组织、社团、志愿服务或其他补充经历。">
      <div className="grid gap-5 md:grid-cols-2">
        <DetailInput label="组织名称" name="organization_name" details={details} fallback={item?.organization} />
        <DetailInput label="担任职务" name="position" details={details} fallback={item?.role_title} />
      </div>
      <div className="mt-5">
        <DetailTextarea label="成果 / 贡献" name="achievements" details={details} />
      </div>
    </AdminFormSection>
  );
}

function DetailInput({ label, name, details, fallback, placeholder }: { label: string; name: string; details: Record<string, string | string[]>; fallback?: string | null; placeholder?: string }) {
  return (
    <Field label={label}>
      <TextInput name={`detail_${name}`} defaultValue={stringDetail(details, name) || fallback || ""} placeholder={placeholder} />
    </Field>
  );
}

function DetailTextarea({ label, name, details, hint, fallback }: { label: string; name: string; details: Record<string, string | string[]>; hint?: string; fallback?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Textarea name={`detail_${name}`} defaultValue={arrayOrStringDetail(details, name) || fallback || ""} />
    </Field>
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

function normalizeDetails(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, string | string[]>;
}

function stringDetail(details: Record<string, string | string[]>, key: string) {
  const value = details[key];
  return typeof value === "string" ? value : "";
}

function arrayOrStringDetail(details: Record<string, string | string[]>, key: string) {
  const value = details[key];
  return Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
}
