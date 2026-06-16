import type { ProfileRecord, ResumeItemRecord, ResumeVersionItemRecord, ResumeVersionRecord } from "@/lib/content-types";
import { detailRecord, getResumeProfileData, normalizeResumeBullets, stringDetail } from "@/lib/resume-display";
import { normalizeProfileFields } from "@/lib/resume-template-model";

export type ResumeQualityStatus = "excellent" | "ready" | "needs_work" | "incomplete";

export type ResumeQualityReport = {
  score: number;
  status: ResumeQualityStatus;
  passed: string[];
  warnings: string[];
  suggestions: string[];
  metrics: {
    visibleItemCount: number;
    bulletCount: number;
    quantifiedBulletCount: number;
  };
};

type AnalyzeResumeQualityInput = {
  version: ResumeVersionRecord;
  versionItems: ResumeVersionItemRecord[];
  profile?: ProfileRecord | null;
  basicItem?: ResumeItemRecord | null;
};

const targetKeywordHints = ["金融", "投研", "投资", "量化", "策略", "私募", "基金", "Python", "AI", "自动化", "数据", "研究", "资产管理", "风控"];
const quantifiedPattern = /[%％+]|\d|[一二三四五六七八九十百千万亿]|提升|降低|覆盖|完成|自动化|效率|增长|减少|倍|万|亿/;

export const resumeQualityStatusMeta: Record<ResumeQualityStatus, { label: string; description: string; toneClass: string }> = {
  excellent: {
    label: "优秀",
    description: "结构完整，已具备较好的投递基础。",
    toneClass: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  },
  ready: {
    label: "基本完整",
    description: "核心信息齐全，建议再补强重点经历。",
    toneClass: "bg-blue-50 text-blue-700 ring-blue-100"
  },
  needs_work: {
    label: "需要补充",
    description: "已有雏形，但投递前仍需补充关键信息。",
    toneClass: "bg-amber-50 text-amber-700 ring-amber-100"
  },
  incomplete: {
    label: "信息不足",
    description: "缺少核心投递信息，建议先补全素材。",
    toneClass: "bg-rose-50 text-rose-700 ring-rose-100"
  }
};

export function analyzeResumeVersionQuality({ version, versionItems, profile, basicItem }: AnalyzeResumeQualityInput): ResumeQualityReport {
  const visibleVersionItems = versionItems.filter((versionItem) => versionItem.is_visible && versionItem.resume_items);
  const bodyVersionItems = visibleVersionItems.filter((versionItem) => versionItem.resume_items?.item_type !== "basic");
  const bodyItems = bodyVersionItems.map((versionItem) => versionItem.resume_items).filter(Boolean) as ResumeItemRecord[];
  const profileFields = normalizeProfileFields(version.profile_fields);
  const profileData = profile ? getResumeProfileData({ profile, basicItem: basicItem ?? null, profileFields, nameFallback: version.title }) : null;
  const targetKeywords = getTargetKeywords(version);
  const allBullets = bodyVersionItems.flatMap((versionItem) => getVisibleItemBullets(versionItem));
  const quantifiedBullets = allBullets.filter((bullet) => quantifiedPattern.test(bullet));
  const passed: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  const hasName = Boolean(profileData?.name?.trim());
  if (hasName) {
    score += 10;
    passed.push("已包含顶部姓名");
  } else {
    warnings.push("缺少顶部姓名或姓名字段被隐藏。");
  }

  const hasContact = Boolean(profileData?.phone?.trim() || profileData?.email?.trim());
  if (hasContact) {
    score += 10;
    passed.push("已包含电话或邮箱");
  } else {
    warnings.push("缺少电话或邮箱，投递前建议补充至少一种联系方式。");
  }

  if (profileFields.show_photo) {
    if (profileData?.photoUrl?.trim()) {
      passed.push("已提供简历照片 URL");
    } else {
      warnings.push("当前版本显示照片，但个人信息素材或 Profile 未提供照片 URL。");
    }
  }

  const hasEducation = hasSection(bodyVersionItems, ["education"], ["education"]);
  if (hasEducation) {
    score += 15;
    passed.push("已包含教育经历");
  } else {
    warnings.push("缺少教育经历。");
  }

  const hasExperience = hasSection(bodyVersionItems, ["experience"], ["experience"]);
  if (hasExperience) {
    score += 20;
    passed.push("已包含实习 / 工作经历");
  } else {
    warnings.push("缺少实习 / 工作经历。");
  }

  const hasProjectOrResearch = hasSection(bodyVersionItems, ["projects", "research"], ["project", "research"]);
  if (hasProjectOrResearch) {
    score += 15;
    passed.push("已包含项目或研究经历");
  } else {
    suggestions.push("建议补充项目经历或研究经历，突出投研、量化或 AI 工作流能力。");
  }

  const hasSkills = hasSection(bodyVersionItems, ["skills"], ["skill", "language"]) || bodyItems.some((item) => item.skills.length > 0);
  if (hasSkills) {
    score += 10;
    passed.push("已包含相关技能");
  } else {
    warnings.push("缺少相关技能区块。");
  }

  if (version.target_role?.trim()) {
    score += 10;
    passed.push("已填写目标岗位 / 投递方向");
  } else {
    warnings.push("缺少目标岗位 / 投递方向。");
  }

  if (allBullets.length >= 3) {
    score += 10;
    passed.push(`已包含 ${allBullets.length} 条经历 bullet`);
  } else {
    warnings.push("经历 bullet 少于 3 条，建议补充可投递的职责、方法和成果。");
  }

  if (quantifiedBullets.length > 0) {
    passed.push("已有量化或结果导向表达");
  } else {
    suggestions.push("建议至少补充 1 条含数字、比例、覆盖范围、效率或成果的量化表达。");
  }

  for (const item of bodyItems) {
    collectItemWarnings(item, warnings, suggestions);
  }

  const duplicateCount = bodyVersionItems.length - new Set(bodyVersionItems.map((item) => item.resume_item_id)).size;
  if (duplicateCount > 0) {
    warnings.push("当前版本存在重复选择的素材，请确认是否有意保留。");
  }

  const longBulletCount = allBullets.filter((bullet) => bullet.length > 120).length;
  if (longBulletCount > 0) {
    suggestions.push(`${longBulletCount} 条 bullet 超过 120 字，建议压缩为更适合简历的一句话。`);
  }

  if (bodyItems.length < 3) {
    warnings.push("展示中的正文素材较少，简历可能显得信息不足。");
  }

  if (bodyItems.length > 10 || allBullets.length > 18) {
    suggestions.push("展示内容较多，打印前请检查是否存在一页过长风险。");
  }

  const adaptationText = [version.target_role, version.summary, version.notes, ...targetKeywords, ...bodyItems.flatMap((item) => [item.title, item.summary, item.role_title, item.organization, ...item.skills, ...item.tags])]
    .filter(Boolean)
    .join(" ");

  if (version.target_role && !hasTargetKeyword(adaptationText, targetKeywords)) {
    suggestions.push("已填写目标岗位，但经历和关键词中与目标方向的呼应还不明显。");
  }

  if (targetKeywords.length > 0) {
    passed.push(`已设置 ${targetKeywords.length} 个目标关键词`);
  } else {
    suggestions.push("可在编辑页补充目标关键词，例如投研、量化、Python、AI 自动化等。");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: getQualityStatus(score),
    passed: dedupe(passed),
    warnings: dedupe(warnings),
    suggestions: dedupe(suggestions),
    metrics: {
      visibleItemCount: bodyItems.length,
      bulletCount: allBullets.length,
      quantifiedBulletCount: quantifiedBullets.length
    }
  };
}

export function getTargetKeywords(version: Pick<ResumeVersionRecord, "template_options">) {
  const raw = version.template_options?.target_keywords;
  if (!Array.isArray(raw)) {
    return [] as string[];
  }

  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function hasSection(versionItems: ResumeVersionItemRecord[], sectionKeys: string[], itemTypes: string[]) {
  return versionItems.some((versionItem) => {
    const item = versionItem.resume_items;
    return Boolean(item && (sectionKeys.includes(versionItem.section_key) || itemTypes.includes(item.item_type)));
  });
}

function getItemBullets(item: ResumeItemRecord) {
  const details = detailRecord(item);
  const values: unknown[] = [item.bullets];

  for (const key of ["results", "achievements", "related_outputs", "description", "outputs"]) {
    const value = details[key];
    if (value) {
      values.push(value);
    }
  }

  return values.flatMap((value) => normalizeResumeBullets(value));
}

function getVisibleItemBullets(versionItem: ResumeVersionItemRecord) {
  const item = versionItem.resume_items;
  if (!item) {
    return [];
  }

  const visible = normalizeBooleanRecord(versionItem.visible_fields);
  const details = detailRecord(item);
  const values: unknown[] = [];

  if (visible.show_bullets !== false) {
    values.push(item.bullets);
  }

  if (visible.show_results !== false) {
    values.push(details.results);
  }

  if (visible.show_achievements !== false) {
    values.push(details.achievements);
  }

  if (visible.show_related_outputs || visible.show_outputs) {
    values.push(details.related_outputs, details.outputs);
  }

  if (visible.show_description) {
    values.push(details.description);
  }

  return values.flatMap((value) => normalizeResumeBullets(value));
}

function collectItemWarnings(item: ResumeItemRecord, warnings: string[], suggestions: string[]) {
  const details = detailRecord(item);
  const hasSummary = Boolean(item.summary?.trim());
  const hasBullets = getItemBullets(item).length > 0;

  if (!hasSummary && !hasBullets && !["skill", "language", "certification", "award"].includes(item.item_type)) {
    suggestions.push(`「${item.title}」缺少 summary 或 bullet，可补充一两条核心贡献。`);
  }

  if (item.item_type === "education") {
    const school = stringDetail(details, "school") || item.organization || item.title;
    if (!school?.trim()) {
      warnings.push("有教育经历缺少学校名称。");
    }
  }

  if (item.item_type === "experience") {
    const organization = stringDetail(details, "company") || item.organization;
    const role = stringDetail(details, "position") || item.role_title;
    if (!organization?.trim()) {
      warnings.push(`「${item.title}」缺少公司 / 机构名称。`);
    }
    if (!role?.trim()) {
      suggestions.push(`「${item.title}」缺少岗位 / 职责名称。`);
    }
  }
}

function hasTargetKeyword(text: string, targetKeywords: string[]) {
  const normalized = text.toLowerCase();
  const keywords = targetKeywords.length > 0 ? targetKeywords : targetKeywordHints;
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function getQualityStatus(score: number): ResumeQualityStatus {
  if (score >= 90) return "excellent";
  if (score >= 75) return "ready";
  if (score >= 50) return "needs_work";
  return "incomplete";
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, boolean>;
  }

  return value as Record<string, boolean>;
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
