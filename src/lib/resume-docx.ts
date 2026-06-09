import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun
} from "docx";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { arrayDetail, detailRecord, formatResumeDateRange, getResumeProfileData, normalizeResumeBullets, stringDetail } from "@/lib/resume-display";

type ResumePrintSection = "education" | "experience" | "campus" | "projects" | "research" | "skills" | "certifications" | "awards" | "other";

type ResumeDocxInput = {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
};

const bulletReference = "resume-bullets";
const font = "Microsoft YaHei";
const defaultPrintSectionOrder: ResumePrintSection[] = ["education", "experience", "campus", "projects", "research", "skills", "certifications", "awards", "other"];
const sectionLabels: Record<ResumePrintSection, string> = {
  education: "教育经历",
  experience: "实习经历",
  campus: "在校经历",
  projects: "项目经历",
  research: "研究经历",
  skills: "相关技能",
  certifications: "证书",
  awards: "荣誉奖项",
  other: "其他经历"
};

export function getExportableResumeItems(version: ResumeVersionWithItems) {
  return version.resume_version_items.filter((versionItem) => versionItem.is_visible && versionItem.resume_items && versionItem.resume_items.item_type !== "basic");
}

export async function buildResumeDocx({ version, profile, basicItem }: ResumeDocxInput) {
  const profileFields = normalizeProfileFields(version.profile_fields);
  const profileData = getResumeProfileData({ profile, basicItem, profileFields, nameFallback: version.title });
  const bodyItems = getExportableResumeItems(version);
  const sectionOrder = normalizeSectionOrder(version.section_order);
  const groupedItems = groupVersionItems(bodyItems);
  const children = [
    ...buildHeader(profileData),
    ...sectionOrder.flatMap((sectionKey) => buildSection(sectionKey, groupedItems.get(sectionKey) ?? []))
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font,
            size: 19,
            color: "111827"
          },
          paragraph: {
            spacing: { after: 80, line: 260 }
          }
        }
      },
      paragraphStyles: [
        {
          id: "ResumeSectionHeading",
          name: "Resume Section Heading",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            bold: true,
            size: 21,
            color: "0f172a",
            font
          },
          paragraph: {
            spacing: { before: 160, after: 90 },
            border: {
              bottom: {
                color: "cbd5e1",
                space: 4,
                style: BorderStyle.SINGLE,
                size: 6
              }
            }
          }
        }
      ]
    },
    numbering: {
      config: [
        {
          reference: bulletReference,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 180 },
                  spacing: { after: 35, line: 245 }
                },
                run: { font, size: 19 }
              }
            }
          ]
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 720,
              right: 850,
              bottom: 720,
              left: 850
            }
          }
        },
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}

export function getResumeDocxFilename({ version, profile, basicItem }: ResumeDocxInput) {
  const profileData = getResumeProfileData({
    profile,
    basicItem,
    profileFields: normalizeProfileFields(version.profile_fields),
    nameFallback: version.title
  });
  const name = sanitizeFilename(profileData.name || version.title || "resume");
  const target = sanitizeFilename(version.target_role || version.title || "简历");
  return `${name}-${target}.docx`;
}

function buildHeader(profileData: ReturnType<typeof getResumeProfileData>) {
  const contactItems = buildContactItems(profileData);
  const paragraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: profileData.name || "简历",
          bold: true,
          size: 30,
          font,
          color: "0f172a"
        })
      ]
    })
  ];

  if (profileData.headline) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 70 },
        children: [new TextRun({ text: profileData.headline, size: 18, color: "475569", font })]
      })
    );
  }

  if (contactItems.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
        children: [new TextRun({ text: contactItems.join("  |  "), size: 18, color: "334155", font })]
      })
    );
  }

  return paragraphs;
}

function buildSection(sectionKey: ResumePrintSection, versionItems: ResumeVersionItemRecord[]) {
  if (versionItems.length === 0) {
    return [];
  }

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      style: "ResumeSectionHeading",
      children: [new TextRun({ text: sectionLabels[sectionKey], bold: true, font })]
    }),
    ...versionItems.flatMap((versionItem) => buildResumeItem(versionItem, sectionKey))
  ];
}

function buildResumeItem(versionItem: ResumeVersionItemRecord, sectionKey: ResumePrintSection) {
  const item = versionItem.resume_items;
  if (!item) {
    return [];
  }

  if (sectionKey === "education") {
    return buildEducationItem(versionItem, item);
  }

  if (sectionKey === "skills") {
    return buildSkillItem(versionItem, item);
  }

  if (sectionKey === "certifications" || sectionKey === "awards") {
    return buildCredentialItem(versionItem, item, sectionKey);
  }

  return buildExperienceItem(versionItem, item, sectionKey);
}

function buildEducationItem(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const school = visible.show_school ? stringDetail(details, "school") || item.organization || item.title : "";
  const date = visible.show_date ? formatResumeDateRange(item) : "";
  const degreeLine = [
    visible.show_degree ? stringDetail(details, "degree") || item.role_title : null,
    visible.show_major ? stringDetail(details, "major") : null,
    visible.show_college ? stringDetail(details, "college") : null,
    visible.show_gpa ? stringDetail(details, "gpa") : null,
    visible.show_location ? item.location : null
  ].filter(Boolean).join(" ｜ ");
  const coreCourses = arrayDetail(details, "core_courses");
  const honors = arrayDetail(details, "honors");

  return compactParagraphs([
    entryHeading(school, date),
    detailParagraph(degreeLine, true),
    visible.show_summary ? summaryParagraph(item.summary) : null,
    visible.show_core_courses && coreCourses.length > 0 ? detailParagraph(`核心课程：${coreCourses.join("、")}`) : null,
    visible.show_honors && honors.length > 0 ? detailParagraph(`荣誉：${honors.join("、")}`) : null,
    ...(visible.show_bullets ? bulletParagraphs(item.bullets) : [])
  ]);
}

function buildExperienceItem(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord, sectionKey: ResumePrintSection) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const organization = getEntryOrganization(item, details, visible, sectionKey);
  const date = visible.show_date ? formatResumeDateRange(item) : "";
  const role = getEntryRole(item, details, visible, sectionKey);
  const roleLine = [role, visible.show_location ? item.location : null].filter(Boolean).join(" ｜ ");
  const detailLines = getEntryDetailLines(item, details, visible, sectionKey);
  const tokens = visible.show_skills || visible.show_tools ? buildTokenLine(item, details) : "";

  return compactParagraphs([
    entryHeading(organization, date),
    detailParagraph(roleLine, true),
    visible.show_summary ? summaryParagraph(item.summary) : null,
    ...detailLines.map((line) => detailParagraph(line)),
    ...(visible.show_bullets ? bulletParagraphs(item.bullets) : []),
    tokens ? detailParagraph(`工具 / 方法：${tokens}`) : null
  ]);
}

function buildSkillItem(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const title = visible.show_skill_category ? stringDetail(details, "skill_category") || item.title : "";
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

  return compactParagraphs([
    new Paragraph({
      spacing: { after: 50, line: 245 },
      children: [
        ...(title ? [new TextRun({ text: `${title}：`, bold: true, font, size: 19 })] : []),
        new TextRun({ text: detail || "未填写技能描述", font, size: 19 })
      ]
    }),
    ...(visible.show_bullets ? bulletParagraphs(item.bullets) : [])
  ]);
}

function buildCredentialItem(versionItem: ResumeVersionItemRecord, item: ResumeItemRecord, sectionKey: "certifications" | "awards") {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const isAward = sectionKey === "awards";
  const title = isAward
    ? (visible.show_award_name ? stringDetail(details, "award_name") || item.title : "")
    : (visible.show_certificate_name ? stringDetail(details, "certificate_name") || item.title : "");
  const date = visible.show_date ? stringDetail(details, "date") || stringDetail(details, "issued_at") || formatResumeDateRange(item) : "";
  const meta = [
    visible.show_issuer ? stringDetail(details, "issuer") || item.organization : null,
    isAward && visible.show_level ? stringDetail(details, "level") : null,
    !isAward && visible.show_valid_until ? stringDetail(details, "valid_until") : null
  ].filter(Boolean).join(" ｜ ");
  const description = visible.show_summary ? stringDetail(details, "description") || item.summary : "";

  return compactParagraphs([
    entryHeading(title, date),
    detailParagraph(meta, true),
    detailParagraph(description),
    ...(visible.show_bullets ? bulletParagraphs(item.bullets) : [])
  ]);
}

function entryHeading(title: string, date: string) {
  if (!title && !date) {
    return null;
  }

  const text = [title, date].filter(Boolean).join("    ");
  return new Paragraph({
    spacing: { before: 40, after: 30, line: 240 },
    children: [new TextRun({ text, bold: true, size: 20, color: "111827", font })]
  });
}

function detailParagraph(text: string | null | undefined, bold = false) {
  if (!text) {
    return null;
  }

  return new Paragraph({
    spacing: { after: 45, line: 245 },
    children: [new TextRun({ text, bold, size: 19, color: "334155", font })]
  });
}

function summaryParagraph(text: string | null | undefined) {
  return detailParagraph(text);
}

function bulletParagraphs(input: unknown) {
  return normalizeResumeBullets(input).map(
    (bullet) =>
      new Paragraph({
        numbering: {
          reference: bulletReference,
          level: 0
        },
        spacing: { after: 35, line: 245 },
        children: [new TextRun({ text: bullet, size: 19, color: "111827", font })]
      })
  );
}

function getEntryOrganization(item: ResumeItemRecord, details: Record<string, unknown>, visible: ReturnType<typeof visibleRecord>, sectionKey: ResumePrintSection) {
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

function getEntryRole(item: ResumeItemRecord, details: Record<string, unknown>, visible: ReturnType<typeof visibleRecord>, sectionKey: ResumePrintSection) {
  const roleParts =
    sectionKey === "experience"
      ? [
          visible.show_position ? stringDetail(details, "position") || item.role_title || item.title : null,
          visible.show_department ? stringDetail(details, "department") : null
        ]
      : sectionKey === "projects"
        ? [visible.show_project_role ? stringDetail(details, "project_role") || item.role_title : null]
        : sectionKey === "research"
          ? [visible.show_research_role ? stringDetail(details, "research_role") || item.role_title : null]
          : [visible.show_position ? stringDetail(details, "position") || item.role_title || item.title : null];

  return roleParts.filter(Boolean).join(" ｜ ");
}

function getEntryDetailLines(item: ResumeItemRecord, details: Record<string, unknown>, visible: ReturnType<typeof visibleRecord>, sectionKey: ResumePrintSection) {
  if (sectionKey === "experience" || sectionKey === "campus" || sectionKey === "other") {
    return [
      visible.show_achievements ? stringDetail(details, "achievements") || stringDetail(details, "results") : null
    ].filter(isNonEmptyString);
  }

  if (sectionKey === "projects") {
    return [
      visible.show_background ? stringDetail(details, "background") : null,
      visible.show_methods ? stringDetail(details, "methods") : null,
      visible.show_results ? stringDetail(details, "results") || stringDetail(details, "achievements") : null
    ].filter(isNonEmptyString);
  }

  if (sectionKey === "research") {
    return [
      visible.show_methods ? stringDetail(details, "methods") : null,
      visible.show_conclusion ? stringDetail(details, "conclusion") : null,
      visible.show_results ? stringDetail(details, "results") : null,
      visible.show_related_outputs ? stringDetail(details, "related_outputs") || stringDetail(details, "outputs") : null
    ].filter(isNonEmptyString);
  }

  return [];
}

function buildTokenLine(item: ResumeItemRecord, details: Record<string, unknown>) {
  return [...item.skills, ...arrayDetail(details, "tools")].filter(Boolean).slice(0, 8).join("、");
}

function groupVersionItems(items: ResumeVersionItemRecord[]) {
  const grouped = new Map<ResumePrintSection, ResumeVersionItemRecord[]>();

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

function mapToPrintSection(versionItem: ResumeVersionItemRecord): ResumePrintSection {
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

function normalizeSectionOrder(value: unknown): ResumePrintSection[] {
  if (!Array.isArray(value)) {
    return defaultPrintSectionOrder;
  }

  const cleaned = value.filter((item): item is ResumePrintSection => typeof item === "string" && defaultPrintSectionOrder.includes(item as ResumePrintSection));
  return cleaned.length > 0 ? [...cleaned, ...defaultPrintSectionOrder.filter((item) => !cleaned.includes(item))] : defaultPrintSectionOrder;
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

function normalizeProfileFields(value: unknown) {
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

function buildContactItems(data: ReturnType<typeof getResumeProfileData>) {
  const rows = [
    { label: "性别", value: data.gender },
    { label: "年龄", value: data.age },
    { label: "电话", value: data.phone },
    { label: "邮箱", value: data.email },
    { label: "所在地", value: data.location },
    { label: "链接", value: data.website },
    { label: "社交", value: data.socialLinks }
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row?.value)).map((row) => `${row.label}：${row.value}`);
}

function compactParagraphs(values: Array<Paragraph | null>) {
  return values.filter((value): value is Paragraph => Boolean(value));
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, boolean>;
}

function isNonEmptyString(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
