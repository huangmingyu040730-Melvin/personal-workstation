import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { getResumeSectionLabel, getResumeTemplateLabel, getResumeVersionLanguageLabel } from "@/lib/content-options";
import type { ProfileRecord, ResumeItemRecord, ResumeSectionKey, ResumeVersionItemRecord } from "@/lib/content-types";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeVersionWithItems } from "@/lib/queries/resume";

const sectionOrder: ResumeSectionKey[] = ["summary", "education", "experience", "projects", "research", "skills", "certifications", "awards", "other"];

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
      <AdminPageSurface>
        <PageHeader
          eyebrow="Resume Preview"
          title={`${version.title} · 预览`}
          description="后台预览只用于检查结构和内容取舍。本阶段不会生成 PDF / Word，也不会创建公开分享链接。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/resume/versions/${version.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回详情
              </Link>
              <Link href={`/dashboard/resume/versions/${version.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Edit size={16} />
                编辑版本
              </Link>
            </div>
          }
        />

        <AdminSecurityNote>
          这是后台预览页，仅管理员可访问。简历版本和素材不会被加入公开站点、sitemap 或分享链接。
        </AdminSecurityNote>

        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-10">
          <ResumeHeader profile={profile} targetRole={version.target_role} summary={version.summary} />

          <div className="mt-8 flex flex-wrap gap-2 border-y border-slate-100 py-4 text-xs">
            <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getResumeVersionLanguageLabel(version.language)}</Badge>
            <Badge className="bg-slate-100 text-slate-600 ring-slate-100">{getResumeTemplateLabel(version.template_key)}</Badge>
            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">{visibleItems.length} 条展示素材</Badge>
          </div>

          <div className="mt-8 space-y-8">
            {sectionOrder.map((sectionKey) => {
              const items = groupedItems.get(sectionKey) ?? [];
              if (items.length === 0) {
                return null;
              }

              return (
                <section key={sectionKey}>
                  <h2 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {getResumeSectionLabel(sectionKey)}
                  </h2>
                  <div className="mt-4 space-y-5">
                    {items.map((versionItem) => {
                      const item = versionItem.resume_items;
                      if (!item) {
                        return null;
                      }

                      return <ResumePreviewItem key={versionItem.id} item={item} note={versionItem.note} />;
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {visibleItems.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              当前版本没有展示中的素材。请返回编辑页选择素材并打开展示开关。
            </div>
          ) : null}
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeHeader({ profile, targetRole, summary }: { profile: ProfileRecord; targetRole: string | null; summary: string | null }) {
  const contact = Object.entries(profile.contact ?? {})
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`);

  const socialLinks = Object.entries(profile.social_links ?? {})
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`);

  return (
    <header className="grid gap-6 md:grid-cols-[1fr_0.75fr] md:items-end">
      <div>
        <p className="text-sm font-semibold text-blue-700">{targetRole || profile.headline || "个人简历预览"}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{profile.display_name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{summary || profile.bio || profile.headline || "尚未填写公开简介。"}</p>
      </div>
      <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-950">{profile.role_title || "研究 / 投资 / AI 工作流"}</p>
        {[profile.organization, profile.location].filter(Boolean).length > 0 ? (
          <p className="mt-1">{[profile.organization, profile.location].filter(Boolean).join(" · ")}</p>
        ) : null}
        {[...contact, ...socialLinks].length > 0 ? (
          <div className="mt-3 space-y-1 text-xs">
            {[...contact, ...socialLinks].slice(0, 5).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ResumePreviewItem({ item, note }: { item: ResumeItemRecord; note: string | null }) {
  return (
    <article>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{[item.organization, item.role_title, item.location].filter(Boolean).join(" · ")}</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-500">{formatResumeDateRange(item)}</p>
      </div>
      {item.summary ? <p className="mt-3 text-sm leading-7 text-slate-700">{item.summary}</p> : null}
      {item.bullets.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
          {item.bullets.map((bullet) => (
            <li key={bullet}>· {bullet}</li>
          ))}
        </ul>
      ) : null}
      {item.skills.length > 0 || item.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...item.skills, ...item.tags].slice(0, 10).map((token) => (
            <span key={token} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{token}</span>
          ))}
        </div>
      ) : null}
      {note ? <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">版本备注：{note}</p> : null}
    </article>
  );
}

function groupVersionItems(items: ResumeVersionItemRecord[]) {
  const grouped = new Map<ResumeSectionKey, ResumeVersionItemRecord[]>();
  for (const item of items) {
    const current = grouped.get(item.section_key) ?? [];
    current.push(item);
    grouped.set(item.section_key, current);
  }

  for (const [key, values] of Array.from(grouped.entries())) {
    grouped.set(key, [...values].sort((a, b) => a.sort_order - b.sort_order || (a.resume_items?.title ?? "").localeCompare(b.resume_items?.title ?? "")));
  }

  return grouped;
}

function formatResumeDateRange(item: ResumeItemRecord) {
  if (!item.start_date && !item.end_date && !item.is_current) {
    return "";
  }

  const start = item.start_date ?? "";
  const end = item.is_current ? "至今" : item.end_date ?? "";
  return [start, end].filter(Boolean).join(" - ");
}
