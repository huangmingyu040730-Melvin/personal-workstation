import type { ProfileRecord, ResumeItemRecord, ResumeVersionItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { arrayDetail, detailRecord, formatResumeDateRange, getResumeProfileData, normalizeResumeBullets, stringDetail } from "@/lib/resume-display";

export type ResumeTemplateSectionKey = "education" | "experience" | "campus" | "projects" | "research" | "skills" | "certifications" | "awards" | "other";

export type ResumeTemplateProfile = ReturnType<typeof getResumeProfileData> & {
  showPhoto: boolean;
};

export type ResumeTemplateEntry = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  summary: string;
  detailLines: string[];
  bullets: string[];
  tokens: string;
  kind: "education" | "experience" | "skill" | "credential";
};

export type ResumeTemplateSection = {
  key: ResumeTemplateSectionKey;
  label: string;
  icon: string;
  entries: ResumeTemplateEntry[];
};

export type ResumeTemplateModel = {
  profile: ResumeTemplateProfile;
  sections: ResumeTemplateSection[];
};

export const defaultResumeSectionOrder: ResumeTemplateSectionKey[] = ["education", "experience", "campus", "projects", "research", "skills", "certifications", "awards", "other"];

export const resumeSectionMeta: Record<ResumeTemplateSectionKey, { label: string; icon: string }> = {
  education: { label: "教育经历", icon: "▣" },
  experience: { label: "实习经历", icon: "▥" },
  campus: { label: "在校经历", icon: "✦" },
  projects: { label: "项目经历", icon: "▧" },
  research: { label: "研究经历", icon: "◆" },
  skills: { label: "相关技能", icon: "▤" },
  certifications: { label: "证书", icon: "◇" },
  awards: { label: "荣誉奖项", icon: "◇" },
  other: { label: "其他经历", icon: "▨" }
};

export function buildResumeTemplateModel({
  version,
  profile,
  basicItem
}: {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
}): ResumeTemplateModel {
  const profileFields = normalizeProfileFields(version.profile_fields);
  const bodyItems = getExportableResumeVersionItems(version);
  const groupedItems = groupVersionItems(bodyItems);
  const sectionOrder = normalizeSectionOrder(version.section_order);

  return {
    profile: {
      ...getResumeProfileData({ profile, basicItem, profileFields, nameFallback: version.title }),
      showPhoto: profileFields.show_photo
    },
    sections: sectionOrder
      .map((sectionKey) => ({
        key: sectionKey,
        label: resumeSectionMeta[sectionKey].label,
        icon: resumeSectionMeta[sectionKey].icon,
        entries: (groupedItems.get(sectionKey) ?? []).map((versionItem) => buildTemplateEntry(versionItem, sectionKey)).filter(isTemplateEntry)
      }))
      .filter((section) => section.entries.length > 0)
  };
}

export function getExportableResumeVersionItems(version: ResumeVersionWithItems) {
  return version.resume_version_items.filter((versionItem) => versionItem.is_visible && versionItem.resume_items && versionItem.resume_items.item_type !== "basic");
}

export function normalizeProfileFields(value: unknown) {
  const raw = normalizeBooleanRecord(value);
  return {
    show_photo: raw.show_photo ?? true,
    show_name: raw.show_name ?? true,
    show_gender: raw.show_gender ?? true,
    show_age: raw.show_age ?? true,
    show_phone: raw.show_phone ?? true,
    show_email: raw.show_email ?? true,
    show_location: raw.show_location ?? false,
    show_headline: raw.show_headline ?? false,
    show_website: raw.show_website ?? false,
    show_social_links: raw.show_social_links ?? false
  };
}

function buildTemplateEntry(versionItem: ResumeVersionItemRecord, sectionKey: ResumeTemplateSectionKey): ResumeTemplateEntry | null {
  const item = versionItem.resume_items;
  if (!item) return null;

  if (sectionKey === "education") {
    return buildEducationEntry(versionItem, item);
  }

  if (sectionKey === "skills") {
    return buildSkillEntry(versionItem, item);
  }

  if (sectionKey === "certifications" || sectionKey === "awards") {
    return buildCredentialEntry(versionItem, item, sectionKey);
  }

  return buildExperienceEntry(versionItem, item, sectionKey);
}

function buildEducationEntry(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord): ResumeTemplateEntry {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const coreCourses = arrayDetail(details, "core_courses");
  const honors = arrayDetail(details, "honors");

  return {
    id: versionItem.id,
    date: visible.show_date ? formatResumeDateRange(item) : "",
    title: visible.show_school ? stringDetail(details, "school") || item.organization || item.title : "",
    subtitle: [
      visible.show_major ? stringDetail(details, "major") : null,
      visible.show_degree ? stringDetail(details, "degree") || item.role_title : null,
      visible.show_college ? stringDetail(details, "college") : null,
      visible.show_gpa ? stringDetail(details, "gpa") : null,
      visible.show_location ? item.location : null
    ].filter(Boolean).join(" | "),
    summary: visible.show_summary ? item.summary ?? "" : "",
    detailLines: [
      visible.show_core_courses && coreCourses.length > 0 ? `核心课程：${coreCourses.join("、")}` : "",
      visible.show_honors && honors.length > 0 ? `荣誉：${honors.join("、")}` : ""
    ].filter(Boolean),
    bullets: visible.show_bullets ? normalizeResumeBullets(item.bullets) : [],
    tokens: "",
    kind: "education"
  };
}

function buildExperienceEntry(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord, sectionKey: ResumeTemplateSectionKey): ResumeTemplateEntry {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const role = getEntryRole(item, details, visible, sectionKey);
  const tokens = visible.show_skills || visible.show_tools ? buildTokenLine(item, details) : "";

  return {
    id: versionItem.id,
    date: visible.show_date ? formatResumeDateRange(item) : "",
    title: getEntryOrganization(item, details, visible, sectionKey),
    subtitle: [role, visible.show_location ? item.location : null].filter(Boolean).join(" | "),
    summary: visible.show_summary ? item.summary ?? "" : "",
    detailLines: getEntryDetailLines(details, visible, sectionKey),
    bullets: visible.show_bullets ? normalizeResumeBullets(item.bullets) : [],
    tokens,
    kind: "experience"
  };
}

function buildSkillEntry(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord): ResumeTemplateEntry {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const skillItems = arrayDetail(details, "skill_items");
  const tools = arrayDetail(details, "tools");
  const detail = [
    visible.show_summary ? item.summary : null,
    visible.show_language_level ? stringDetail(details, "language_level") : null,
    visible.show_proficiency ? stringDetail(details, "proficiency") : null,
    visible.show_skill_items && skillItems.length > 0 ? skillItems.join("、") : null,
    visible.show_skill_items && item.skills.length > 0 ? item.skills.join("、") : null,
    visible.show_tools && tools.length > 0 ? tools.join("、") : null
  ].filter(Boolean).join("；");

  return {
    id: versionItem.id,
    date: "",
    title: visible.show_skill_category ? stringDetail(details, "skill_category") || item.title : "",
    subtitle: detail,
    summary: "",
    detailLines: [],
    bullets: visible.show_bullets ? normalizeResumeBullets(item.bullets) : [],
    tokens: "",
    kind: "skill"
  };
}

function buildCredentialEntry(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord, sectionKey: "certifications" | "awards"): ResumeTemplateEntry {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const isAward = sectionKey === "awards";
  const title = isAward
    ? (visible.show_award_name ? stringDetail(details, "award_name") || item.title : "")
    : (visible.show_certificate_name ? stringDetail(details, "certificate_name") || item.title : "");

  return {
    id: versionItem.id,
    date: visible.show_date ? stringDetail(details, "date") || stringDetail(details, "issued_at") || formatResumeDateRange(item) : "",
    title,
    subtitle: [
      visible.show_issuer ? stringDetail(details, "issuer") || item.organization : null,
      isAward && visible.show_level ? stringDetail(details, "level") : null,
      !isAward && visible.show_valid_until ? stringDetail(details, "valid_until") : null
    ].filter(Boolean).join(" | "),
    summary: visible.show_summary ? stringDetail(details, "description") || item.summary || "" : "",
    detailLines: [],
    bullets: visible.show_bullets ? normalizeResumeBullets(item.bullets) : [],
    tokens: "",
    kind: "credential"
  };
}

function getEntryOrganization(item: ResumeItemRecord, details: Record<string, unknown>, visible: ReturnType<typeof visibleRecord>, sectionKey: ResumeTemplateSectionKey) {
  if (sectionKey === "experience") {
    return visible.show_company ? stringDetail(details, "company") || item.organization || item.title : "";
  }
  if (sectionKey === "projects") {
    return visible.show_project_name ? stringDetail(details, "project_name") || item.title : "";
  }
  if (sectionKey === "research") {
    return visible.show_research_topic ? stringDetail(details, "research_topic") || stringDetail(details, "topic") || item.title : "";
  }
  return visible.show_organization ? stringDetail(details, "organization_name") || item.organization || item.title : "";
}

function getEntryRole(item: ResumeItemRecord, details: Record<string, unknown>, visible: ReturnType<typeof visibleRecord>, sectionKey: ResumeTemplateSectionKey) {
  const roleParts =
    sectionKey === "experience"
      ? [
          visible.show_position ? stringDetail(details, "position") || item.role_title || item.title : null,
          visible.show_department ? stringDetail(details, "department") : null
        ]
      : sectionKey === "projects"
        ? [visible.show_project_role ? stringDetail(details, "project_role") || item.role_title : null, visible.show_methods ? stringDetail(details, "methods") : null]
        : sectionKey === "research"
          ? [visible.show_research_role ? stringDetail(details, "research_role") || item.role_title : null, visible.show_methods ? stringDetail(details, "methods") : null]
          : [visible.show_position ? stringDetail(details, "position") || item.role_title || item.title : null];

  return roleParts.filter(Boolean).join(" | ");
}

function getEntryDetailLines(details: Record<string, unknown>, visible: ReturnType<typeof visibleRecord>, sectionKey: ResumeTemplateSectionKey) {
  if (sectionKey === "experience" || sectionKey === "campus" || sectionKey === "other") {
    return [
      visible.show_achievements ? stringDetail(details, "achievements") || stringDetail(details, "results") : ""
    ].filter(Boolean);
  }

  if (sectionKey === "projects") {
    return [
      visible.show_background ? stringDetail(details, "background") : "",
      visible.show_results ? stringDetail(details, "results") || stringDetail(details, "achievements") : ""
    ].filter(Boolean);
  }

  if (sectionKey === "research") {
    return [
      visible.show_conclusion ? stringDetail(details, "conclusion") : "",
      visible.show_results ? stringDetail(details, "results") : "",
      visible.show_related_outputs ? stringDetail(details, "related_outputs") || stringDetail(details, "outputs") : ""
    ].filter(Boolean);
  }

  return [];
}

function buildTokenLine(item: ResumeItemRecord, details: Record<string, unknown>) {
  return [...item.skills, ...arrayDetail(details, "tools")].filter(Boolean).slice(0, 8).join("、");
}

function groupVersionItems(items: ResumeVersionItemRecord[]) {
  const grouped = new Map<ResumeTemplateSectionKey, ResumeVersionItemRecord[]>();

  for (const item of items) {
    const key = mapToPrintSection(item);
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  }

  for (const [key, values] of Array.from(grouped.entries())) {
    grouped.set(key, [...values].sort((a, b) => a.sort_order - b.sort_order || (a.resume_items?.title ?? "").localeCompare(b.resume_items?.title ?? "")));
  }

  return grouped;
}

function mapToPrintSection(versionItem: ResumeVersionItemRecord): ResumeTemplateSectionKey {
  const sectionKey = versionItem.section_key;
  const itemType = versionItem.resume_items?.item_type;

  if (sectionKey === "education" || itemType === "education") return "education";
  if (sectionKey === "experience" || itemType === "experience") return "experience";
  if (sectionKey === "projects" || itemType === "project") return "projects";
  if (sectionKey === "research" || itemType === "research") return "research";
  if (sectionKey === "skills" || itemType === "skill" || itemType === "language") return "skills";
  if (sectionKey === "certifications" || itemType === "certification") return "certifications";
  if (sectionKey === "awards" || itemType === "award") return "awards";
  if (sectionKey === "other" || itemType === "other") return "campus";
  return "other";
}

function normalizeSectionOrder(value: unknown): ResumeTemplateSectionKey[] {
  if (!Array.isArray(value)) {
    return defaultResumeSectionOrder;
  }

  const cleaned = value.filter((item): item is ResumeTemplateSectionKey => typeof item === "string" && defaultResumeSectionOrder.includes(item as ResumeTemplateSectionKey));
  return cleaned.length > 0 ? [...cleaned, ...defaultResumeSectionOrder.filter((item) => !cleaned.includes(item))] : defaultResumeSectionOrder;
}

function visibleRecord(versionItem: ResumeVersionItemRecord) {
  const raw = normalizeBooleanRecord(versionItem.visible_fields);
  return {
    show_date: raw.show_date ?? true,
    show_school: raw.show_school ?? raw.show_organization ?? true,
    show_company: raw.show_company ?? raw.show_organization ?? true,
    show_organization: raw.show_organization ?? true,
    show_project_name: raw.show_project_name ?? raw.show_organization ?? true,
    show_research_topic: raw.show_research_topic ?? raw.show_organization ?? true,
    show_position: raw.show_position ?? raw.show_role_title ?? true,
    show_department: raw.show_department ?? true,
    show_project_role: raw.show_project_role ?? raw.show_role_title ?? true,
    show_research_role: raw.show_research_role ?? raw.show_role_title ?? true,
    show_location: raw.show_location ?? true,
    show_summary: raw.show_summary ?? true,
    show_bullets: raw.show_bullets ?? true,
    show_results: raw.show_results ?? true,
    show_achievements: raw.show_achievements ?? raw.show_results ?? true,
    show_skills: raw.show_skills ?? true,
    show_tools: raw.show_tools ?? raw.show_skills ?? true,
    show_core_courses: raw.show_core_courses ?? true,
    show_skill_category: raw.show_skill_category ?? true,
    show_skill_items: raw.show_skill_items ?? raw.show_skills ?? true,
    show_proficiency: raw.show_proficiency ?? false,
    show_language_level: raw.show_language_level ?? false,
    show_major: raw.show_major ?? true,
    show_degree: raw.show_degree ?? true,
    show_college: raw.show_college ?? true,
    show_gpa: raw.show_gpa ?? false,
    show_honors: raw.show_honors ?? true,
    show_background: raw.show_background ?? true,
    show_methods: raw.show_methods ?? true,
    show_conclusion: raw.show_conclusion ?? true,
    show_certificate_name: raw.show_certificate_name ?? true,
    show_award_name: raw.show_award_name ?? true,
    show_issuer: raw.show_issuer ?? true,
    show_level: raw.show_level ?? true,
    show_valid_until: raw.show_valid_until ?? true,
    show_related_outputs: raw.show_related_outputs ?? raw.show_outputs ?? false
  };
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, boolean>;
}

function isTemplateEntry(entry: ResumeTemplateEntry | null): entry is ResumeTemplateEntry {
  return Boolean(entry && (entry.title || entry.subtitle || entry.summary || entry.detailLines.length > 0 || entry.bullets.length > 0));
}
