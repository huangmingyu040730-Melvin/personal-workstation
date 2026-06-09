import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Award, BriefcaseBusiness, Edit, GraduationCap, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { PageHeader } from "@/components/page-header";
import { ResumePrintButton } from "@/components/resume-print-button";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionItemRecord } from "@/lib/content-types";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeVersionWithItems } from "@/lib/queries/resume";
import { cn } from "@/lib/utils";

type ResumePrintSection = "education" | "experience" | "campus" | "projects" | "research" | "skills" | "certifications" | "awards" | "other";
type DetailRecord = Record<string, unknown>;

const defaultPrintSectionOrder: ResumePrintSection[] = ["education", "experience", "campus", "projects", "research", "skills", "certifications", "awards", "other"];

const printSectionMeta: Record<ResumePrintSection, { label: string; icon: ReactNode }> = {
  education: { label: "教育经历", icon: <GraduationCap size={15} /> },
  experience: { label: "实习经历", icon: <BriefcaseBusiness size={15} /> },
  campus: { label: "在校经历", icon: <Award size={15} /> },
  projects: { label: "项目经历", icon: <BriefcaseBusiness size={15} /> },
  research: { label: "研究经历", icon: <Sparkles size={15} /> },
  skills: { label: "相关技能", icon: <Sparkles size={15} /> },
  certifications: { label: "证书", icon: <Award size={15} /> },
  awards: { label: "荣誉奖项", icon: <Award size={15} /> },
  other: { label: "其他经历", icon: <BriefcaseBusiness size={15} /> }
};

export default async function ResumeVersionPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [version, publicProfile] = await Promise.all([getResumeVersionWithItems(id), getPublicProfile()]);

  if (!version) {
    notFound();
  }

  const profile = publicProfile ?? getProfileFallback();
  const visibleItems = version.resume_version_items.filter((item) => item.is_visible && item.resume_items);
  const basicItem = visibleItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
  const profileFields = normalizeBooleanRecord(version.profile_fields);
  const sectionOrder = normalizeSectionOrder(version.section_order);
  const groupedItems = groupVersionItems(visibleItems.filter((item) => item.resume_items?.item_type !== "basic"));

  return (
    <AppShell>
      <AdminPageSurface className="resume-preview-page">
        <div className="resume-preview-toolbar">
          <PageHeader
            eyebrow="Resume Preview"
            title={`${version.title} · 简历预览`}
            description="预览采用 A4 纸张式中文简历模板，贴近上传参考 PDF。点击打印后可在浏览器中另存为 PDF。"
            action={
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/resume/versions/${version.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <ArrowLeft size={16} />
                  返回详情
                </Link>
                <Link href={`/dashboard/resume/versions/${version.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <Edit size={16} />
                  编辑版本
                </Link>
                <ResumePrintButton />
              </div>
            }
          />

          <AdminSecurityNote>
            这是后台预览页，仅管理员可访问。打印导出由浏览器完成，不会创建公开简历页面、分享链接或后端 PDF / Word 文件。
          </AdminSecurityNote>
        </div>

        <div className="resume-paper-wrap">
          <article className="resume-paper">
            <ResumeHeader profile={profile} basicItem={basicItem} profileFields={profileFields} />
            {version.summary && profileFields.show_headline ? <p className="resume-version-summary">{version.summary}</p> : null}

            {sectionOrder.map((sectionKey) => {
              const items = groupedItems.get(sectionKey) ?? [];
              if (items.length === 0) {
                return null;
              }

              return (
                <section key={sectionKey} className="resume-print-section">
                  <div className="resume-print-section-title">
                    <span className="resume-print-section-icon">{printSectionMeta[sectionKey].icon}</span>
                    <h2>{printSectionMeta[sectionKey].label}</h2>
                  </div>
                  <div className={cn("resume-section-body", sectionKey === "skills" && "resume-section-body-compact")}>
                    {items.map((versionItem) => {
                      const item = versionItem.resume_items;
                      if (!item) {
                        return null;
                      }

                      if (sectionKey === "education") {
                        return <EducationResumeItem key={versionItem.id} versionItem={versionItem} item={item} />;
                      }

                      if (sectionKey === "skills") {
                        return <SkillResumeItem key={versionItem.id} versionItem={versionItem} item={item} />;
                      }

                      return <ExperienceResumeItem key={versionItem.id} versionItem={versionItem} item={item} />;
                    })}
                  </div>
                </section>
              );
            })}

            {visibleItems.length === 0 ? (
              <div className="resume-empty-print-state">当前版本没有展示中的素材。请返回编辑页选择素材并打开展示开关。</div>
            ) : null}
          </article>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeHeader({ profile, basicItem, profileFields }: { profile: ProfileRecord; basicItem: ResumeItemRecord | null; profileFields: Record<string, boolean> }) {
  const details = detailRecord(basicItem);
  const displayName = basicItem?.title || profile.display_name;
  const photoUrl = stringDetail(details, "photo_url") || null;
  const infoItems = buildResumeContactItems(profile, details, profileFields);

  return (
    <header className="resume-print-header">
      <div className="resume-photo-box">
        {photoUrl && profileFields.show_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={`${displayName} 简历照片`} className="h-full w-full object-cover" />
        ) : (
          <span>照片</span>
        )}
      </div>
      <div className="resume-header-main">
        <h1>{displayName}</h1>
        {profileFields.show_headline && (stringDetail(details, "direction") || profile.headline || profile.role_title) ? (
          <p className="resume-headline">{stringDetail(details, "direction") || profile.headline || profile.role_title}</p>
        ) : null}
        {infoItems.length > 0 ? (
          <div className="resume-info-grid">
            {infoItems.map((item) => (
              <p key={`${item.label}-${item.value}`}>
                <strong>{item.label}：</strong>
                <span>{item.value}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function EducationResumeItem({ versionItem, item }: { versionItem: ResumeVersionItemRecord; item: ResumeItemRecord }) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const school = stringDetail(details, "school") || item.organization || item.title;
  const degreeLine = [stringDetail(details, "degree") || item.role_title, stringDetail(details, "major"), stringDetail(details, "college"), item.location].filter(Boolean).join(" ｜ ");
  const coreCourses = arrayDetail(details, "core_courses");
  const honors = arrayDetail(details, "honors");

  return (
    <article className="resume-entry">
      <div className="resume-entry-line">
        {visible.show_date ? <span className="resume-entry-date">{formatResumeDateRange(item)}</span> : <span />}
        {visible.show_organization ? <span className="resume-entry-org">{school}</span> : null}
      </div>
      {visible.show_role_title && degreeLine ? <div className="resume-entry-role">{degreeLine}</div> : null}
      {visible.show_summary && item.summary ? <p className="resume-entry-summary">{item.summary}</p> : null}
      {visible.show_core_courses && coreCourses.length > 0 ? <p className="resume-detail-line"><strong>核心课程：</strong>{coreCourses.join("、")}</p> : null}
      {honors.length > 0 ? <p className="resume-detail-line"><strong>荣誉：</strong>{honors.join("、")}</p> : null}
      {visible.show_bullets ? <ResumeBullets item={item} /> : null}
    </article>
  );
}

function ExperienceResumeItem({ versionItem, item }: { versionItem: ResumeVersionItemRecord; item: ResumeItemRecord }) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const organization = stringDetail(details, "company") || stringDetail(details, "organization_name") || item.organization || item.title;
  const role = [stringDetail(details, "position") || stringDetail(details, "project_role") || item.role_title || item.title, stringDetail(details, "department"), stringDetail(details, "business_area")].filter(Boolean).join(" ｜ ");
  const methodLine = [stringDetail(details, "topic"), stringDetail(details, "background"), stringDetail(details, "methods"), stringDetail(details, "conclusion")].filter(Boolean);

  return (
    <article className="resume-entry">
      <div className="resume-entry-line">
        {visible.show_date ? <span className="resume-entry-date">{formatResumeDateRange(item)}</span> : <span />}
        {visible.show_organization ? <span className="resume-entry-org">{organization}</span> : null}
      </div>
      {visible.show_role_title && role ? <div className="resume-entry-role">{[role, visible.show_location ? item.location : null].filter(Boolean).join(" ｜ ")}</div> : null}
      {visible.show_summary && item.summary ? <p className="resume-entry-summary">{item.summary}</p> : null}
      {methodLine.map((line) => (
        <p key={line} className="resume-detail-line">{line}</p>
      ))}
      {visible.show_bullets ? <ResumeBullets item={item} /> : null}
      {visible.show_skills ? <ResumeTokens item={item} /> : null}
    </article>
  );
}

function SkillResumeItem({ versionItem, item }: { versionItem: ResumeVersionItemRecord; item: ResumeItemRecord }) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const title = stringDetail(details, "skill_category") || item.title;
  const skillItems = arrayDetail(details, "skill_items");
  const detail = [
    visible.show_summary ? item.summary : null,
    visible.show_bullets && item.bullets.length > 0 ? item.bullets.join("；") : null,
    visible.show_skills && skillItems.length > 0 ? skillItems.join("、") : null,
    visible.show_skills && item.skills.length > 0 ? item.skills.join("、") : null
  ]
    .filter(Boolean)
    .join("；");

  return (
    <article className="resume-skill-entry">
      <span className="resume-skill-title">{title}</span>
      {detail ? <span className="resume-skill-detail">{detail}</span> : null}
    </article>
  );
}

function ResumeBullets({ item }: { item: ResumeItemRecord }) {
  if (item.bullets.length === 0) {
    return null;
  }

  return (
    <ul className="resume-bullets">
      {item.bullets.map((bullet) => (
        <li key={bullet}>{bullet}</li>
      ))}
    </ul>
  );
}

function ResumeTokens({ item }: { item: ResumeItemRecord }) {
  const tokens = [...item.skills, ...arrayDetail(detailRecord(item), "tools")].slice(0, 8);

  if (tokens.length === 0) {
    return null;
  }

  return <p className="resume-token-line">工具 / 方法：{tokens.join("、")}</p>;
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

function buildResumeContactItems(profile: ProfileRecord, details: DetailRecord, profileFields: Record<string, boolean>) {
  const profileContact = profile.contact ?? {};
  const profileSocial = profile.social_links ?? {};
  const rows = [
    profileFields.show_gender ? { label: "性别", value: stringDetail(details, "gender") || stringValue(profileContact.gender) || stringValue(profileContact.sex) } : null,
    profileFields.show_age ? { label: "年龄", value: stringDetail(details, "age") || stringValue(profileContact.age) } : null,
    profileFields.show_phone ? { label: "电话", value: stringDetail(details, "phone") || stringValue(profileContact.phone) || stringValue(profileContact.mobile) } : null,
    profileFields.show_email ? { label: "邮箱", value: stringDetail(details, "email") || stringValue(profileContact.email) } : null,
    profileFields.show_location ? { label: "所在地", value: stringDetail(details, "location") || profile.location } : null,
    profileFields.show_website ? { label: "链接", value: stringDetail(details, "website") || stringValue(profileSocial.website) || stringValue(profileSocial.github) } : null
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row?.value));
}

function visibleRecord(versionItem: ResumeVersionItemRecord) {
  const raw = normalizeBooleanRecord(versionItem.visible_fields);
  return {
    show_date: raw.show_date ?? true,
    show_organization: raw.show_organization ?? true,
    show_role_title: raw.show_role_title ?? true,
    show_location: raw.show_location ?? true,
    show_summary: raw.show_summary ?? true,
    show_bullets: raw.show_bullets ?? true,
    show_skills: raw.show_skills ?? true,
    show_tags: raw.show_tags ?? false,
    show_core_courses: raw.show_core_courses ?? true
  };
}

function detailRecord(item: ResumeItemRecord | null) {
  if (!item?.details || typeof item.details !== "object" || Array.isArray(item.details)) {
    return {};
  }

  return item.details as DetailRecord;
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, boolean>;
}

function stringDetail(details: DetailRecord, key: string) {
  return stringValue(details[key]);
}

function arrayDetail(details: DetailRecord, key: string) {
  const value = details[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function formatResumeDateRange(item: ResumeItemRecord) {
  const start = formatResumeMonth(item.start_date);
  const end = item.is_current ? "至今" : formatResumeMonth(item.end_date);

  if (!start && !end) {
    return "";
  }

  return [start, end].filter(Boolean).join("-");
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
