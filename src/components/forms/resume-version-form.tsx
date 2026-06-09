import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import {
  resumeSectionKeys,
  resumeTemplateKeys,
  resumeVersionLanguages
} from "@/lib/content-options";
import type { ResumeItemRecord, ResumeSectionKey, ResumeVersionItemRecord, ResumeVersionRecord } from "@/lib/content-types";
import { getResumeItemDisplay } from "@/lib/resume-display";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

type VersionSection = {
  key: ResumeSectionKey;
  label: string;
  description: string;
  itemTypes: ResumeItemRecord["item_type"][];
};

const versionSections: VersionSection[] = [
  { key: "education", label: "教育经历", description: "学校、专业、学位、核心课程和荣誉。", itemTypes: ["education"] },
  { key: "experience", label: "实习经历", description: "公司、岗位、职责、方法和成果。", itemTypes: ["experience"] },
  { key: "other", label: "在校经历", description: "学生组织、社团、志愿服务或其他校园经历。", itemTypes: ["other"] },
  { key: "projects", label: "项目经历", description: "投研、量化、AI 工作流等项目经历。", itemTypes: ["project"] },
  { key: "research", label: "研究经历", description: "研究主题、框架、方法和结论。", itemTypes: ["research"] },
  { key: "skills", label: "相关技能", description: "技能、语言能力和 AI 工作流能力。", itemTypes: ["skill", "language"] },
  { key: "certifications", label: "证书", description: "证书、资格或培训记录。", itemTypes: ["certification"] },
  { key: "awards", label: "荣誉奖项", description: "奖项和荣誉记录。", itemTypes: ["award"] }
];

const profileFieldOptions = [
  { key: "show_name", label: "姓名" },
  { key: "show_photo", label: "照片" },
  { key: "show_gender", label: "性别" },
  { key: "show_age", label: "年龄" },
  { key: "show_phone", label: "电话" },
  { key: "show_email", label: "邮箱" },
  { key: "show_location", label: "所在地" },
  { key: "show_headline", label: "一句话定位" },
  { key: "show_website", label: "个人网站" },
  { key: "show_social_links", label: "社交链接" }
];

const visibleFieldOptionsBySection: Record<ResumeSectionKey, Array<{ key: string; label: string; defaultChecked?: boolean }>> = {
  summary: [
    { key: "show_photo", label: "照片", defaultChecked: true },
    { key: "show_name", label: "姓名", defaultChecked: true },
    { key: "show_gender", label: "性别", defaultChecked: true },
    { key: "show_age", label: "年龄", defaultChecked: true },
    { key: "show_phone", label: "电话", defaultChecked: true },
    { key: "show_email", label: "邮箱", defaultChecked: true },
    { key: "show_location", label: "所在地" },
    { key: "show_website", label: "个人网站" },
    { key: "show_social_links", label: "社交链接" },
    { key: "show_direction", label: "求职方向" }
  ],
  education: [
    { key: "show_date", label: "时间", defaultChecked: true },
    { key: "show_school", label: "学校", defaultChecked: true },
    { key: "show_college", label: "学院", defaultChecked: true },
    { key: "show_major", label: "专业", defaultChecked: true },
    { key: "show_degree", label: "学位", defaultChecked: true },
    { key: "show_gpa", label: "GPA" },
    { key: "show_core_courses", label: "核心课程", defaultChecked: true },
    { key: "show_honors", label: "荣誉", defaultChecked: true },
    { key: "show_location", label: "地点" }
  ],
  experience: [
    { key: "show_date", label: "时间", defaultChecked: true },
    { key: "show_company", label: "公司", defaultChecked: true },
    { key: "show_department", label: "部门", defaultChecked: true },
    { key: "show_position", label: "岗位", defaultChecked: true },
    { key: "show_location", label: "地点" },
    { key: "show_summary", label: "摘要", defaultChecked: true },
    { key: "show_bullets", label: "工作内容", defaultChecked: true },
    { key: "show_achievements", label: "成果", defaultChecked: true },
    { key: "show_tools", label: "工具 / 技能", defaultChecked: true }
  ],
  other: [
    { key: "show_date", label: "时间", defaultChecked: true },
    { key: "show_organization", label: "组织", defaultChecked: true },
    { key: "show_position", label: "职务", defaultChecked: true },
    { key: "show_location", label: "地点" },
    { key: "show_summary", label: "摘要", defaultChecked: true },
    { key: "show_bullets", label: "工作内容", defaultChecked: true },
    { key: "show_achievements", label: "成果", defaultChecked: true }
  ],
  projects: [
    { key: "show_date", label: "时间", defaultChecked: true },
    { key: "show_project_name", label: "项目名称", defaultChecked: true },
    { key: "show_project_role", label: "项目角色", defaultChecked: true },
    { key: "show_background", label: "背景", defaultChecked: true },
    { key: "show_methods", label: "方法 / 工具", defaultChecked: true },
    { key: "show_bullets", label: "项目内容", defaultChecked: true },
    { key: "show_results", label: "成果", defaultChecked: true },
    { key: "show_skills", label: "技能", defaultChecked: true }
  ],
  research: [
    { key: "show_date", label: "时间", defaultChecked: true },
    { key: "show_research_topic", label: "研究主题", defaultChecked: true },
    { key: "show_research_role", label: "研究角色", defaultChecked: true },
    { key: "show_methods", label: "方法", defaultChecked: true },
    { key: "show_conclusion", label: "结论", defaultChecked: true },
    { key: "show_bullets", label: "研究内容", defaultChecked: true },
    { key: "show_results", label: "成果", defaultChecked: true },
    { key: "show_related_outputs", label: "关联产出" },
    { key: "show_skills", label: "技能", defaultChecked: true }
  ],
  skills: [
    { key: "show_skill_category", label: "技能类别", defaultChecked: true },
    { key: "show_skill_items", label: "技能条目", defaultChecked: true },
    { key: "show_proficiency", label: "熟练度" },
    { key: "show_language_level", label: "语言等级" },
    { key: "show_summary", label: "说明", defaultChecked: true },
    { key: "show_tools", label: "工具列表", defaultChecked: true }
  ],
  certifications: [
    { key: "show_certificate_name", label: "证书名称", defaultChecked: true },
    { key: "show_issuer", label: "颁发机构", defaultChecked: true },
    { key: "show_date", label: "取得时间", defaultChecked: true },
    { key: "show_valid_until", label: "有效期" },
    { key: "show_summary", label: "说明", defaultChecked: true }
  ],
  awards: [
    { key: "show_award_name", label: "奖项名称", defaultChecked: true },
    { key: "show_issuer", label: "授予机构", defaultChecked: true },
    { key: "show_date", label: "时间", defaultChecked: true },
    { key: "show_level", label: "级别" },
    { key: "show_summary", label: "说明", defaultChecked: true }
  ]
};

export function ResumeVersionForm({
  action,
  version,
  versionItems = [],
  resumeItems,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  version?: ResumeVersionRecord | null;
  versionItems?: ResumeVersionItemRecord[];
  resumeItems: ResumeItemRecord[];
  error?: string;
}) {
  const selectedByItemId = new Map(versionItems.map((item) => [item.resume_item_id, item]));
  const profileFields = normalizeBooleanRecord(version?.profile_fields);
  const basicItems = resumeItems
    .filter((item) => item.item_type === "basic")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const selectableResumeItems = resumeItems.filter((item) => item.item_type !== "basic");
  const bodySectionOptions = resumeSectionKeys.filter((section) => section.value !== "summary");

  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />

      <AdminFormSection title="版本信息" description="版本用于面向不同岗位、场景或语言组合简历素材。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="版本名称">
            <TextInput name="title" defaultValue={version?.title} placeholder="例如 投研实习申请版、量化研究版" required />
          </Field>
          <Field label="目标岗位 / 场景">
            <TextInput name="target_role" defaultValue={version?.target_role ?? ""} placeholder="例如 量化研究实习、资产管理研究岗" />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="版本摘要">
            <Textarea name="summary" defaultValue={version?.summary ?? ""} placeholder="概括这个版本的定位、重点能力和适用场景。" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="语言、模板与状态" description="本阶段保存组合结构和浏览器打印预览，不生成后端 PDF / Word。">
        <div className="grid gap-5 md:grid-cols-4">
          <Field label="语言">
            <Select name="language" defaultValue={version?.language ?? "zh"}>
              {resumeVersionLanguages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="模板">
            <Select name="template_key" defaultValue={version?.template_key ?? "classic"}>
              {resumeTemplateKeys.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="权限">
            <Select name="visibility" defaultValue={version?.visibility ?? "private"}>
              <option value="private">私密</option>
              <option value="public">公开</option>
            </Select>
          </Field>
          <div className="flex flex-col justify-end gap-2">
            <Checkbox name="is_active" label="启用版本" defaultChecked={version?.is_active ?? true} />
            <Checkbox name="is_featured" label="重点版本" defaultChecked={version?.is_featured ?? false} />
          </div>
        </div>
        <div className="mt-5">
          <Field label="内部备注">
            <Textarea name="notes" defaultValue={version?.notes ?? ""} placeholder="记录这个版本的使用场景、后续调整建议或待补素材。" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="顶部个人信息" description="控制简历顶部展示哪些个人字段。具体内容来自 Profile 或简历素材库中的「个人信息」素材。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {profileFieldOptions.map((option) => (
            <Checkbox key={option.key} name={option.key} label={option.label} defaultChecked={profileFields[option.key] ?? ["show_photo", "show_name", "show_gender", "show_age", "show_phone", "show_email"].includes(option.key)} />
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          {basicItems.length > 0 ? (
            <span>当前会优先使用最近更新的「个人信息」素材：{basicItems[0]?.title}；若字段为空，则回退到 Profile。</span>
          ) : (
            <span>如需展示电话、年龄、性别或照片，请先在简历素材库中新增「个人信息」素材，或在 Profile 中维护公开基础信息。</span>
          )}
        </div>
      </AdminFormSection>

      <AdminFormSection title="按区块选择素材" description="选择进入正文区块的教育、实习、项目、研究、技能、证书和奖项素材。个人信息不在这里重复选择。">
        {selectableResumeItems.length > 0 ? (
          <div className="space-y-5">
            {versionSections.map((section) => {
              const sectionItems = selectableResumeItems.filter((item) => section.itemTypes.includes(item.item_type));
              if (sectionItems.length === 0) {
                return null;
              }

              return (
                <section key={section.key} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{section.label}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">{sectionItems.length} 条</span>
                  </div>
                  <div className="space-y-3">
                    {sectionItems.map((item) => {
                      const selected = selectedByItemId.get(item.id);
                      const visibleFields = normalizeBooleanRecord(selected?.visible_fields);
                      const currentSectionKey = selected?.section_key && selected.section_key !== "summary" ? selected.section_key : section.key;
                      const display = getResumeItemDisplay(item, currentSectionKey);
                      const fieldOptions = visibleFieldOptionsBySection[currentSectionKey] ?? visibleFieldOptionsBySection[section.key];

                      return (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <label className="flex min-w-0 gap-3">
                              <input
                                type="checkbox"
                                name="resume_item_id"
                                value={item.id}
                                defaultChecked={Boolean(selected)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-slate-950">{display.title}</span>
                                {display.subtitle ? <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600">{display.subtitle}</span> : null}
                                {display.meta ? <span className="mt-1 line-clamp-1 block text-xs leading-5 text-slate-500">{display.meta}</span> : null}
                                {!display.subtitle && !display.meta && display.description ? <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{display.description}</span> : null}
                              </span>
                            </label>
                            <div className="grid gap-3 sm:grid-cols-[150px_100px_120px]">
                              <Select name={`section_key_${item.id}`} defaultValue={currentSectionKey}>
                                {bodySectionOptions.map((sectionOption) => (
                                  <option key={sectionOption.value} value={sectionOption.value}>
                                    {sectionOption.label}
                                  </option>
                                ))}
                              </Select>
                              <TextInput name={`sort_order_${item.id}`} type="number" min={0} max={9999} defaultValue={selected?.sort_order ?? item.sort_order ?? 0} />
                              <Checkbox name={`is_visible_${item.id}`} label="展示" defaultChecked={selected?.is_visible ?? true} />
                            </div>
                          </div>
                          <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold text-slate-500">当前版本可见字段</p>
                            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                              {fieldOptions.map((option) => (
                                <Checkbox
                                  key={option.key}
                                  name={`${option.key}_${item.id}`}
                                  label={option.label}
                                  defaultChecked={visibleFields[option.key] ?? option.defaultChecked ?? false}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="mt-3">
                            <Textarea
                              name={`note_${item.id}`}
                              defaultValue={selected?.note ?? ""}
                              className="min-h-16"
                              placeholder="可选：记录此素材在当前版本中的使用说明，不默认进入打印稿。"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            暂无简历素材。请先创建素材，再回来组合版本。
            <Link href="/dashboard/resume/new" className="ml-2 font-semibold text-blue-700">
              新建素材
            </Link>
          </div>
        )}
      </AdminFormSection>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={version ? `/dashboard/resume/versions/${version.id}` : "/dashboard/resume/versions"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, boolean>;
}
