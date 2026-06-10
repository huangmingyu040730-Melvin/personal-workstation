import type { ProfileRecord, ResumeItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { buildResumeTemplateModel, type ResumeTemplateEntry } from "@/lib/resume-template-model";

export type ResumeAiInputEntry = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  summary: string;
  detailLines: string[];
  bullets: string[];
  tokens: string;
  kind: ResumeTemplateEntry["kind"];
};

export type ResumeAiInputSection = {
  key: string;
  label: string;
  entries: ResumeAiInputEntry[];
};

export type ResumeAiInputContext = {
  version: {
    title: string;
    targetRole: string | null;
    summary: string | null;
    targetKeywords: string[];
  };
  profile: Record<string, string>;
  sections: ResumeAiInputSection[];
};

export function pickResumeBasicItem(version: ResumeVersionWithItems, basicItems: ResumeItemRecord[]) {
  const visibleItems = version.resume_version_items.filter((item) => item.is_visible && item.resume_items);
  const selectedBasicItem = visibleItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
  const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  return selectedBasicItem ?? latestBasicItem;
}

export function buildResumeAiInputContext({
  version,
  profile,
  basicItem,
  targetKeywords
}: {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
  targetKeywords: string[];
}): ResumeAiInputContext {
  const model = buildResumeTemplateModel({ version, profile, basicItem });

  return {
    version: {
      title: version.title,
      targetRole: version.target_role,
      summary: version.summary,
      targetKeywords
    },
    profile: cleanProfileFields({
      name: model.profile.name,
      headline: model.profile.headline,
      gender: model.profile.gender,
      age: model.profile.age,
      phone: model.profile.phone,
      email: model.profile.email,
      location: model.profile.location,
      website: model.profile.website,
      socialLinks: model.profile.socialLinks
    }),
    sections: model.sections.map((section) => ({
      key: section.key,
      label: section.label,
      entries: section.entries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        title: entry.title,
        subtitle: entry.subtitle,
        summary: entry.summary,
        detailLines: entry.detailLines,
        bullets: entry.bullets,
        tokens: entry.tokens,
        kind: entry.kind
      }))
    }))
  };
}

function cleanProfileFields(fields: Record<string, string>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value.trim().length > 0));
}
