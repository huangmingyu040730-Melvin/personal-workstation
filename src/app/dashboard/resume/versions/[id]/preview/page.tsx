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
import { getResumeItems, getResumeVersionWithItems } from "@/lib/queries/resume";
import { arrayDetail, detailRecord, formatResumeDateRange, getResumeProfileData, normalizeResumeBullets, stringDetail } from "@/lib/resume-display";
import { cn } from "@/lib/utils";

type ResumePrintSection = "education" | "experience" | "campus" | "projects" | "research" | "skills" | "certifications" | "awards" | "other";
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
  const [version, publicProfile, basicItems] = await Promise.all([
    getResumeVersionWithItems(id),
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);

  if (!version) {
    notFound();
  }

  const profile = publicProfile ?? getProfileFallback();
  const visibleItems = version.resume_version_items.filter((item) => item.is_visible && item.resume_items);
  const bodyItems = visibleItems.filter((item) => item.resume_items?.item_type !== "basic");
  const selectedBasicItem = visibleItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
  const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  const basicItem = selectedBasicItem ?? latestBasicItem;
  const profileFields = normalizeProfileFields(version.profile_fields);
  const sectionOrder = normalizeSectionOrder(version.section_order);
  const groupedItems = groupVersionItems(bodyItems);

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
            <ResumeHeader profile={profile} basicItem={basicItem} profileFields={profileFields} nameFallback={version.title} />

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

                      if (sectionKey === "certifications" || sectionKey === "awards") {
                        return <CredentialResumeItem key={versionItem.id} versionItem={versionItem} item={item} sectionKey={sectionKey} />;
                      }

                      return <ExperienceResumeItem key={versionItem.id} versionItem={versionItem} item={item} sectionKey={sectionKey} />;
                    })}
                  </div>
                </section>
              );
            })}

            {bodyItems.length === 0 ? (
              <div className="resume-empty-print-state">当前版本没有展示中的正文素材。请返回编辑页选择教育、实习、项目、研究或技能素材。</div>
            ) : null}
          </article>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeHeader({ profile, basicItem, profileFields, nameFallback }: { profile: ProfileRecord; basicItem: ResumeItemRecord | null; profileFields: Record<string, boolean>; nameFallback: string }) {
  const data = getResumeProfileData({ profile, basicItem, profileFields, nameFallback });
  const infoItems = buildResumeContactItems(data);

  return (
    <header className="resume-print-header">
      {profileFields.show_photo ? (
        <div className="resume-photo-box">
          {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={`${data.name || "候选人"} 简历照片`} className="h-full w-full object-cover" />
          ) : (
            <span>照片</span>
          )}
        </div>
      ) : null}
      <div className="resume-header-main">
        {data.name ? <h1>{data.name}</h1> : null}
        {data.headline ? <p className="resume-headline">{data.headline}</p> : null}
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
  const degreeLine = [
    visible.show_degree ? stringDetail(details, "degree") || item.role_title : null,
    visible.show_major ? stringDetail(details, "major") : null,
    visible.show_college ? stringDetail(details, "college") : null,
    visible.show_gpa ? stringDetail(details, "gpa") : null,
    visible.show_location ? item.location : null
  ].filter(Boolean).join(" ｜ ");
  const coreCourses = arrayDetail(details, "core_courses");
  const honors = arrayDetail(details, "honors");

  return (
    <article className="resume-entry">
      <div className="resume-entry-line">
        {visible.show_date ? <span className="resume-entry-date">{formatResumeDateRange(item)}</span> : <span />}
        {visible.show_school ? <span className="resume-entry-org">{school}</span> : null}
      </div>
      {degreeLine ? <div className="resume-entry-role">{degreeLine}</div> : null}
      {visible.show_summary && item.summary ? <p className="resume-entry-summary">{item.summary}</p> : null}
      {visible.show_core_courses && coreCourses.length > 0 ? <p className="resume-detail-line"><strong>核心课程：</strong>{coreCourses.join("、")}</p> : null}
      {visible.show_honors && honors.length > 0 ? <p className="resume-detail-line"><strong>荣誉：</strong>{honors.join("、")}</p> : null}
      {visible.show_bullets ? <ResumeBullets item={item} /> : null}
    </article>
  );
}

function ExperienceResumeItem({ versionItem, item, sectionKey }: { versionItem: ResumeVersionItemRecord; item: ResumeItemRecord; sectionKey: ResumePrintSection }) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const organization = getEntryOrganization(item, details, visible, sectionKey);
  const role = getEntryRole(item, details, visible, sectionKey);
  const detailLines = getEntryDetailLines(item, details, visible, sectionKey);

  return (
    <article className="resume-entry">
      <div className="resume-entry-line">
        {visible.show_date ? <span className="resume-entry-date">{formatResumeDateRange(item)}</span> : <span />}
        {organization ? <span className="resume-entry-org">{organization}</span> : null}
      </div>
      {role ? <div className="resume-entry-role">{[role, visible.show_location ? item.location : null].filter(Boolean).join(" ｜ ")}</div> : null}
      {visible.show_summary && item.summary ? <p className="resume-entry-summary">{item.summary}</p> : null}
      {detailLines.map((line) => (
        <p key={line} className="resume-detail-line">{line}</p>
      ))}
      {visible.show_bullets ? <ResumeBullets item={item} /> : null}
      {visible.show_skills || visible.show_tools ? <ResumeTokens item={item} /> : null}
    </article>
  );
}

function SkillResumeItem({ versionItem, item }: { versionItem: ResumeVersionItemRecord; item: ResumeItemRecord }) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const title = stringDetail(details, "skill_category") || item.title;
  const skillItems = arrayDetail(details, "skill_items");
  const tools = arrayDetail(details, "tools");
  const detail = [
    visible.show_summary ? item.summary : null,
    visible.show_language_level ? stringDetail(details, "language_level") : null,
    visible.show_proficiency ? stringDetail(details, "proficiency") : null,
    visible.show_skill_items && skillItems.length > 0 ? skillItems.join("、") : null,
    visible.show_skill_items && item.skills.length > 0 ? item.skills.join("、") : null,
    visible.show_tools && tools.length > 0 ? tools.join("、") : null
  ]
    .filter(Boolean)
    .join("；");

  return (
    <article className="resume-skill-entry">
      {visible.show_skill_category ? <span className="resume-skill-title">{title}</span> : null}
      {detail ? <span className="resume-skill-detail">{detail}</span> : null}
    </article>
  );
}

function CredentialResumeItem({ versionItem, item, sectionKey }: { versionItem: ResumeVersionItemRecord; item: ResumeItemRecord; sectionKey: "certifications" | "awards" }) {
  const details = detailRecord(item);
  const visible = visibleRecord(versionItem);
  const isAward = sectionKey === "awards";
  const title = isAward
    ? (visible.show_award_name ? stringDetail(details, "award_name") || item.title : "")
    : (visible.show_certificate_name ? stringDetail(details, "certificate_name") || item.title : "");
  const meta = [
    visible.show_issuer ? stringDetail(details, "issuer") || item.organization : null,
    isAward && visible.show_level ? stringDetail(details, "level") : null,
    !isAward && visible.show_valid_until ? stringDetail(details, "valid_until") : null
  ].filter(Boolean).join(" ｜ ");
  const description = visible.show_summary ? stringDetail(details, "description") || item.summary : "";

  return (
    <article className="resume-entry">
      <div className="resume-entry-line">
        {visible.show_date ? <span className="resume-entry-date">{stringDetail(details, "date") || stringDetail(details, "issued_at") || formatResumeDateRange(item)}</span> : <span />}
        {title ? <span className="resume-entry-org">{title}</span> : null}
      </div>
      {meta ? <div className="resume-entry-role">{meta}</div> : null}
      {description ? <p className="resume-entry-summary">{description}</p> : null}
      {visible.show_bullets ? <ResumeBullets item={item} /> : null}
    </article>
  );
}

function ResumeBullets({ item }: { item: ResumeItemRecord }) {
  const bullets = normalizeResumeBullets(item.bullets);

  if (bullets.length === 0) {
    return null;
  }

  return (
    <ul className="resume-bullets">
      {bullets.map((bullet) => (
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
    ].filter(Boolean);
  }

  if (sectionKey === "projects") {
    return [
      visible.show_background ? stringDetail(details, "background") : null,
      visible.show_methods ? stringDetail(details, "methods") : null,
      visible.show_results ? stringDetail(details, "results") || stringDetail(details, "achievements") : null
    ].filter(Boolean);
  }

  if (sectionKey === "research") {
    return [
      visible.show_methods ? stringDetail(details, "methods") : null,
      visible.show_conclusion ? stringDetail(details, "conclusion") : null,
      visible.show_results ? stringDetail(details, "results") : null,
      visible.show_related_outputs ? stringDetail(details, "related_outputs") || stringDetail(details, "outputs") : null
    ].filter(Boolean);
  }

  return [];
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

function buildResumeContactItems(data: ReturnType<typeof getResumeProfileData>) {
  const rows = [
    { label: "性别", value: data.gender },
    { label: "年龄", value: data.age },
    { label: "电话", value: data.phone },
    { label: "邮箱", value: data.email },
    { label: "所在地", value: data.location },
    { label: "链接", value: data.website },
    { label: "社交", value: data.socialLinks }
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row?.value));
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
    show_tags: raw.show_tags ?? false,
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
    show_description: raw.show_description ?? true,
    show_related_outputs: raw.show_related_outputs ?? raw.show_outputs ?? false
  };
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, boolean>;
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
