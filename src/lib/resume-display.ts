import type { ResumeItemRecord, ResumeSectionKey } from "@/lib/content-types";

export type ResumeItemDisplay = {
  title: string;
  subtitle: string;
  meta?: string;
  description?: string;
};

export function getResumeItemDisplay(item: ResumeItemRecord, sectionKey?: ResumeSectionKey | null): ResumeItemDisplay {
  const details = detailRecord(item);
  const section = sectionKey ?? sectionKeyFromItemType(item.item_type);
  const dateRange = formatResumeDateRange(item);

  if (item.item_type === "basic" || section === "summary") {
    const title = firstString(details, ["name"]) || item.title || "个人信息";
    const subtitle = joinParts([
      stringDetail(details, "gender"),
      stringDetail(details, "age"),
      stringDetail(details, "phone"),
      stringDetail(details, "email"),
      stringDetail(details, "location")
    ]);
    return {
      title,
      subtitle,
      meta: firstString(details, ["direction", "website", "social_links"]) || item.summary || undefined
    };
  }

  if (item.item_type === "education" || section === "education") {
    const title = firstString(details, ["school"]) || item.organization || item.title || "未命名素材";
    const subtitle = joinParts([stringDetail(details, "major"), stringDetail(details, "degree"), stringDetail(details, "college"), dateRange]);
    const coreCourses = arrayDetail(details, "core_courses");
    return {
      title,
      subtitle,
      meta: coreCourses.length > 0 ? `核心课程：${coreCourses.join("、")}` : undefined,
      description: item.summary ?? undefined
    };
  }

  if (item.item_type === "experience" || section === "experience") {
    const title = firstString(details, ["company"]) || item.organization || item.title || "未命名素材";
    const subtitle = joinParts([stringDetail(details, "department"), stringDetail(details, "position") || item.role_title, dateRange]);
    return {
      title,
      subtitle,
      meta: firstString(details, ["business_area"]) || item.location || undefined,
      description: item.summary ?? item.bullets[0]
    };
  }

  if (item.item_type === "other" || section === "other") {
    const title = firstString(details, ["organization_name"]) || item.organization || item.title || "未命名素材";
    const subtitle = joinParts([stringDetail(details, "position") || item.role_title, dateRange]);
    return {
      title,
      subtitle,
      meta: item.location ?? undefined,
      description: item.summary ?? item.bullets[0]
    };
  }

  if (item.item_type === "project" || section === "projects") {
    const title = firstString(details, ["project_name"]) || item.title || "未命名素材";
    const subtitle = joinParts([stringDetail(details, "project_role"), stringDetail(details, "methods"), dateRange]);
    return {
      title,
      subtitle,
      meta: arrayDetail(details, "tools").join("、") || undefined,
      description: firstString(details, ["background", "conclusion"]) || item.summary || item.bullets[0]
    };
  }

  if (item.item_type === "research" || section === "research") {
    const title = firstString(details, ["research_topic", "topic"]) || item.title || "未命名素材";
    const subtitle = joinParts([stringDetail(details, "research_role"), stringDetail(details, "methods"), dateRange]);
    return {
      title,
      subtitle,
      meta: firstString(details, ["conclusion"]) || undefined,
      description: item.summary ?? item.bullets[0]
    };
  }

  if (item.item_type === "skill" || item.item_type === "language" || section === "skills") {
    const title = firstString(details, ["skill_category"]) || item.title || "未命名素材";
    const skills = [...arrayDetail(details, "skill_items"), stringDetail(details, "language_level"), ...item.skills].filter(Boolean);
    return {
      title,
      subtitle: skills.join("、"),
      meta: firstString(details, ["proficiency"]) || undefined,
      description: item.summary ?? item.bullets[0]
    };
  }

  if (item.item_type === "certification" || section === "certifications") {
    const title = firstString(details, ["certificate_name"]) || item.title || "未命名素材";
    return {
      title,
      subtitle: joinParts([stringDetail(details, "issuer") || item.organization, firstString(details, ["date", "issued_at"]), stringDetail(details, "valid_until")]),
      description: firstString(details, ["description"]) || item.summary || undefined
    };
  }

  if (item.item_type === "award" || section === "awards") {
    const title = firstString(details, ["award_name"]) || item.title || "未命名素材";
    return {
      title,
      subtitle: joinParts([stringDetail(details, "issuer") || item.organization, stringDetail(details, "level"), firstString(details, ["date", "issued_at"])]),
      description: firstString(details, ["description"]) || item.summary || undefined
    };
  }

  return {
    title: item.title || "未命名素材",
    subtitle: joinParts([item.organization, item.role_title, dateRange]),
    description: item.summary ?? item.bullets[0]
  };
}

export function detailRecord(item: ResumeItemRecord | null | undefined) {
  if (!item?.details || typeof item.details !== "object" || Array.isArray(item.details)) {
    return {};
  }

  return item.details as Record<string, unknown>;
}

export function stringDetail(details: Record<string, unknown>, key: string) {
  return stringValue(details[key]);
}

export function arrayDetail(details: Record<string, unknown>, key: string) {
  const value = details[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function formatResumeDateRange(item: Pick<ResumeItemRecord, "start_date" | "end_date" | "is_current">) {
  const start = formatResumeMonth(item.start_date);
  const end = item.is_current ? "至今" : formatResumeMonth(item.end_date);

  if (!start && !end) {
    return "";
  }

  return [start, end].filter(Boolean).join("-");
}

export function sectionKeyFromItemType(itemType: ResumeItemRecord["item_type"]): ResumeSectionKey {
  if (itemType === "education") return "education";
  if (itemType === "experience") return "experience";
  if (itemType === "project") return "projects";
  if (itemType === "research") return "research";
  if (itemType === "skill" || itemType === "language") return "skills";
  if (itemType === "certification") return "certifications";
  if (itemType === "award") return "awards";
  if (itemType === "basic") return "summary";
  return "other";
}

function firstString(details: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = stringDetail(details, key);
    if (value) {
      return value;
    }
  }
  return "";
}

function joinParts(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim())).join("｜");
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function formatResumeMonth(value: string | null) {
  if (!value) {
    return "";
  }

  const [year, month] = value.split("-");
  if (!year || !month) {
    return value;
  }

  return `${year}.${month}`;
}
