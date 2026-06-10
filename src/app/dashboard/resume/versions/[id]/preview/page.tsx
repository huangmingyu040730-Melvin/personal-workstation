import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, FileDown, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { PageHeader } from "@/components/page-header";
import { ResumeQualityPreviewNotice } from "@/components/resume-quality";
import { ResumePrintButton } from "@/components/resume-print-button";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems, getResumeVersionWithItems } from "@/lib/queries/resume";
import { normalizeResumeBullets } from "@/lib/resume-display";
import { analyzeResumeVersionQuality } from "@/lib/resume-quality";
import type { ResumeTemplateEntry, ResumeTemplateModel } from "@/lib/resume-template-model";
import { buildResumeTemplateModel } from "@/lib/resume-template-model";
import { cn } from "@/lib/utils";

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
  const selectedBasicItem = visibleItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
  const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  const basicItem = selectedBasicItem ?? latestBasicItem;
  const quality = analyzeResumeVersionQuality({ version, versionItems: version.resume_version_items, profile, basicItem });
  const model = buildResumeTemplateModel({ version, profile, basicItem });

  return (
    <AppShell>
      <AdminPageSurface className="resume-preview-page">
        <div className="resume-preview-toolbar">
          <PageHeader
            eyebrow="Resume Preview"
            title={`${version.title} · 简历预览`}
            description="网页预览用于快速检查内容结构，最终排版以导出的 Word 文件为准。"
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
                <Link href={`/dashboard/resume/versions/${version.id}/jd-review`} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
                  <Sparkles size={16} />
                  AI JD 优化
                </Link>
                <Link href={`/dashboard/resume/versions/${version.id}/export/docx`} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100">
                  <FileDown size={16} />
                  导出 Word
                </Link>
                <ResumePrintButton />
              </div>
            }
          />

          <AdminSecurityNote>
            这是后台预览页，仅管理员可访问。最终投递排版以 20260523 脱敏 Word 模板导出的文件为准；网页预览、浏览器打印和 WPS 可能存在渲染差异。
          </AdminSecurityNote>

          <ResumeQualityPreviewNotice report={quality} />
        </div>

        <div className="resume-paper-wrap">
          <ResumePaper model={model} />
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumePaper({ model }: { model: ResumeTemplateModel }) {
  return (
    <article className="resume-paper">
      <ResumeHeader model={model} />

      {model.sections.map((section) => (
        <section key={section.key} className="resume-print-section">
          <div className="resume-print-section-title">
            <span className="resume-print-section-icon" aria-hidden="true">{section.icon}</span>
            <h2>{section.label}</h2>
          </div>
          <div className={cn("resume-section-body", section.key === "skills" && "resume-section-body-compact")}>
            {section.entries.map((entry) => (
              <ResumeEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      {model.sections.length === 0 ? (
        <div className="resume-empty-print-state">当前版本没有展示中的正文素材。请返回编辑页选择教育、实习、项目、研究或技能素材。</div>
      ) : null}
    </article>
  );
}

function ResumeHeader({ model }: { model: ResumeTemplateModel }) {
  const data = model.profile;
  const infoItems = buildResumeContactItems(data);

  return (
    <header className={cn("resume-print-header", !data.showPhoto && "resume-print-header-no-photo")}>
      {data.showPhoto ? (
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

function ResumeEntry({ entry }: { entry: ResumeTemplateEntry }) {
  if (entry.kind === "skill") {
    return (
      <article className="resume-skill-entry">
        {entry.title ? <span className="resume-skill-title">{entry.title}：</span> : null}
        {entry.subtitle ? <span className="resume-skill-detail">{entry.subtitle}</span> : null}
        <ResumeBullets bullets={entry.bullets} />
      </article>
    );
  }

  return (
    <article className="resume-entry">
      <div className="resume-entry-grid">
        <div className="resume-entry-date">{entry.date}</div>
        <div className="resume-entry-content">
          <div className="resume-entry-org">{entry.title}</div>
          {entry.subtitle ? <div className="resume-entry-role">{entry.subtitle}</div> : null}
          {entry.summary ? <ResumeTextBlock text={entry.summary} paragraphClassName="resume-entry-summary" /> : null}
          {entry.detailLines.map((line) => (
            <ResumeTextBlock key={line} text={line} />
          ))}
          <ResumeBullets bullets={entry.bullets} />
          {entry.tokens ? <p className="resume-token-line">工具 / 方法：{entry.tokens}</p> : null}
        </div>
      </div>
    </article>
  );
}

function ResumeTextBlock({ text, paragraphClassName = "resume-detail-line" }: { text: string; paragraphClassName?: string }) {
  const bullets = normalizeResumeBullets(text);
  const looksLikeList = bullets.length > 1 || /^[\s]*(?:[•·-]|\d+[.、])/.test(text);

  if (looksLikeList && bullets.length > 0) {
    return <ResumeBullets bullets={bullets} />;
  }

  return <p className={paragraphClassName}>{text}</p>;
}

function ResumeBullets({ bullets }: { bullets: string[] }) {
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

function buildResumeContactItems(data: ResumeTemplateModel["profile"]) {
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
