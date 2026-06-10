import { readFileSync } from "node:fs";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { buildResumeTemplateModel, getExportableResumeVersionItems, type ResumeTemplateEntry, type ResumeTemplateModel } from "@/lib/resume-template-model";

type ResumeDocxInput = {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
};

type ResumeDocxTemplateData = {
  name: string;
  genderRow: string;
  ageRow: string;
  phoneRow: string;
  emailRow: string;
  contactLine: string;
  education: ResumeDocxTemplateEntry[];
  experience: ResumeDocxTemplateEntry[];
  campus: ResumeDocxTemplateEntry[];
  skills: ResumeDocxTemplateSkillEntry[];
  extraSections: Array<{
    label: string;
    entries: ResumeDocxTemplateEntry[];
  }>;
};

type ResumeDocxTemplateEntry = {
  date: string;
  title: string;
  subtitle: string;
  summary: string;
  detailLines: string[];
  bullets: ResumeDocxBullet[];
  tokenLines: string[];
};

type ResumeDocxTemplateSkillEntry = {
  label: string;
  text: string;
  bullets: ResumeDocxBullet[];
};

type ResumeDocxBullet = {
  label: string;
  text: string;
};

const templatePath = path.join(process.cwd(), "src/templates/resume/20260523-resume-template.docx");

export function getExportableResumeItems(version: ResumeVersionWithItems) {
  return getExportableResumeVersionItems(version);
}

export async function buildResumeDocx({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const template = readFileSync(templatePath);
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => ""
  });

  doc.render(buildResumeDocxTemplateData(model));

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
}

export function getResumeDocxFilename({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const name = sanitizeFilename(model.profile.name || version.title || "resume");
  const target = sanitizeFilename(version.target_role || version.title || "简历");
  return `${name}-${target}.docx`;
}

function buildResumeDocxTemplateData(model: ResumeTemplateModel): ResumeDocxTemplateData {
  const sectionMap = new Map(model.sections.map((section) => [section.key, section]));
  const extraSectionKeys = model.sections.filter((section) => !["education", "experience", "campus", "skills"].includes(section.key));

  return {
    name: model.profile.name || "简历",
    genderRow: formatContactItem("性别", model.profile.gender),
    ageRow: formatContactItem("年龄", model.profile.age),
    phoneRow: formatContactItem("电话", model.profile.phone),
    emailRow: formatContactItem("邮箱", model.profile.email),
    contactLine: buildContactLine(model.profile),
    education: (sectionMap.get("education")?.entries ?? []).map((entry) => buildEntryData(entry)),
    experience: (sectionMap.get("experience")?.entries ?? []).map((entry) => buildEntryData(entry)),
    campus: (sectionMap.get("campus")?.entries ?? []).map((entry) => buildEntryData(entry)),
    skills: (sectionMap.get("skills")?.entries ?? []).map((entry) => buildSkillEntryData(entry)),
    extraSections: extraSectionKeys.map((section) => ({
      label: section.label,
      entries: section.entries.map((entry) => buildEntryData(entry))
    }))
  };
}

function buildEntryData(entry: ResumeTemplateEntry) {
  return {
    date: entry.date || "",
    title: entry.title || "",
    subtitle: entry.subtitle || "",
    summary: entry.summary || "",
    detailLines: entry.detailLines.filter(Boolean),
    bullets: entry.bullets.filter(Boolean).map(splitBulletText),
    tokenLines: entry.tokens ? [entry.tokens] : []
  };
}

function buildSkillEntryData(entry: ResumeTemplateEntry): ResumeDocxTemplateSkillEntry {
  const content = [entry.subtitle, entry.summary, ...entry.detailLines, entry.tokens ? `工具 / 方法：${entry.tokens}` : ""].filter(Boolean).join("；");

  return {
    label: entry.title ? `${entry.title}：` : "",
    text: content,
    bullets: entry.bullets.filter(Boolean).map(splitBulletText)
  };
}

function buildContactLine(data: ResumeTemplateModel["profile"]) {
  return [
    data.headline,
    formatContactItem("所在地", data.location),
    formatContactItem("链接", data.website),
    formatContactItem("社交", data.socialLinks)
  ].filter(Boolean).join("    ");
}

function formatContactItem(label: string, value?: string | null) {
  return value ? `${label}：${value}` : "";
}

function splitBulletText(value: string): ResumeDocxBullet {
  const cleaned = value.trim().replace(/^[•·\\-]\\s*/, "");
  const match = cleaned.match(/^(.{2,28}?[：:])\\s*(.+)$/);

  if (!match) {
    return { label: "", text: cleaned };
  }

  return {
    label: match[1],
    text: match[2]
  };
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return sanitized || "resume";
}
