import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { PageHeader } from "@/components/page-header";
import { ResumePrintButton } from "@/components/resume-print-button";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionItemRecord } from "@/lib/content-types";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeVersionWithItems } from "@/lib/queries/resume";
import { cn } from "@/lib/utils";

type ResumePrintSection = "education" | "experience" | "projects" | "research" | "campus" | "skills" | "certifications" | "awards" | "other";

const printSectionOrder: ResumePrintSection[] = ["education", "experience", "projects", "research", "campus", "skills", "certifications", "awards", "other"];

const printSectionLabels: Record<ResumePrintSection, string> = {
  education: "教育经历",
  experience: "实习经历",
  projects: "项目经历",
  research: "研究经历",
  campus: "在校经历",
  skills: "相关技能",
  certifications: "证书",
  awards: "荣誉奖项",
  other: "其他经历"
};

export default async function ResumeVersionPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [version, publicProfile] = await Promise.all([getResumeVersionWithItems(id), getPublicProfile()]);

  if (!version) {
    notFound();
  }

  const profile = publicProfile ?? getProfileFallback();
  const visibleItems = version.resume_version_items.filter((item) => item.is_visible && item.resume_items);
  const groupedItems = groupVersionItems(visibleItems);

  return (
    <AppShell>
      <AdminPageSurface className="resume-preview-page">
        <div className="resume-preview-toolbar">
          <PageHeader
            eyebrow="Resume Preview"
            title={`${version.title} · 简历预览`}
            description="预览采用 A4 纸张式中文金融简历排版。点击打印后可在浏览器中另存为 PDF。"
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
            这是后台预览页，仅管理员可访问。打印导出由浏览器完成，不会创建公开简历页面、分享链接或后端 PDF 文件。
          </AdminSecurityNote>
        </div>

        <div className="resume-paper-wrap">
          <article className="resume-paper">
            <ResumeHeader profile={profile} />
            {version.summary ? <p className="resume-version-summary">{version.summary}</p> : null}

            {printSectionOrder.map((sectionKey) => {
              const items = groupedItems.get(sectionKey) ?? [];
              if (items.length === 0) {
                return null;
              }

              return (
                <section key={sectionKey} className="resume-print-section">
                  <h2>{printSectionLabels[sectionKey]}</h2>
                  <div className={cn("resume-section-body", sectionKey === "skills" && "resume-section-body-compact")}>
                    {items.map((versionItem) => {
                      const item = versionItem.resume_items;
                      if (!item) {
                        return null;
                      }

                      return sectionKey === "skills" ? (
                        <SkillResumeItem key={versionItem.id} item={item} note={versionItem.note} />
                      ) : (
                        <ExperienceResumeItem key={versionItem.id} item={item} note={versionItem.note} />
                      );
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

function ResumeHeader({ profile }: { profile: ProfileRecord }) {
  const contactItems = buildPublicContactItems(profile);

  return (
    <header className="resume-print-header">
      <h1>{profile.display_name}</h1>
      {contactItems.length > 0 ? (
        <p className="resume-contact-line">
          {contactItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      ) : null}
      {profile.headline || profile.role_title ? <p className="resume-headline">{profile.headline || profile.role_title}</p> : null}
    </header>
  );
}

function ExperienceResumeItem({ item, note }: { item: ResumeItemRecord; note: string | null }) {
  return (
    <article className="resume-entry">
      <div className="resume-entry-line">
        <span className="resume-entry-date">{formatResumeDateRange(item)}</span>
        <span className="resume-entry-org">{item.organization || item.title}</span>
      </div>
      <div className="resume-entry-role">{[item.title, item.role_title, item.location].filter(Boolean).join(" · ")}</div>
      {item.summary ? <p className="resume-entry-summary">{item.summary}</p> : null}
      <ResumeBullets item={item} />
      <ResumeTokens item={item} />
      {note ? <p className="resume-entry-note">{note}</p> : null}
    </article>
  );
}

function SkillResumeItem({ item, note }: { item: ResumeItemRecord; note: string | null }) {
  const detail = [
    item.summary,
    item.bullets.length > 0 ? item.bullets.join("；") : null,
    item.skills.length > 0 ? item.skills.join("、") : null
  ]
    .filter(Boolean)
    .join("；");

  return (
    <article className="resume-skill-entry">
      <span className="resume-skill-title">{item.title}</span>
      {detail ? <span className="resume-skill-detail">{detail}</span> : null}
      {note ? <span className="resume-skill-note">（{note}）</span> : null}
    </article>
  );
}

function ResumeBullets({ item }: { item: ResumeItemRecord }) {
  const bullets = item.bullets.length > 0 ? item.bullets : [];

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
  const tokens = [...item.skills, ...item.tags].slice(0, 8);

  if (tokens.length === 0) {
    return null;
  }

  return <p className="resume-token-line">关键词：{tokens.join("、")}</p>;
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

function buildPublicContactItems(profile: ProfileRecord) {
  const rawContact = profile.contact ?? {};
  const rawSocialLinks = profile.social_links ?? {};
  const orderedKeys = ["gender", "sex", "age", "phone", "mobile", "email", "wechat", "location"];
  const labelMap: Record<string, string> = {
    gender: "",
    sex: "",
    age: "",
    phone: "电话",
    mobile: "电话",
    email: "邮箱",
    wechat: "微信",
    location: ""
  };

  const contactItems = orderedKeys
    .map((key) => {
      const value = key === "location" ? profile.location : rawContact[key];
      if (!value || typeof value !== "string" || value.trim().length === 0) {
        return null;
      }

      const label = labelMap[key];
      return label ? `${label}: ${value.trim()}` : value.trim();
    })
    .filter(Boolean) as string[];

  const socialItems = Object.entries(rawSocialLinks)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${value}`);

  return [...contactItems, ...socialItems].slice(0, 7);
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
