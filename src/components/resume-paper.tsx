import { normalizeResumeBullets } from "@/lib/resume-display";
import type { ResumeTemplateEntry, ResumeTemplateModel } from "@/lib/resume-template-model";
import { cn } from "@/lib/utils";

export function ResumePaper({ model }: { model: ResumeTemplateModel }) {
  return (
    <article className="resume-paper">
      <ResumeHeader model={model} />

      {model.sections.map((section) => (
        <section key={section.key} className="resume-print-section">
          <div className="resume-print-section-title">
            <h2>{section.label}</h2>
          </div>
          <div className={cn("resume-section-body", section.key === "skills" && "resume-section-body-compact")}>
            {section.entries.map((entry) => (
              <ResumeEntry key={entry.id} entry={entry} sectionKey={section.key} />
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
    <header className={cn("resume-print-header", !(data.showPhoto && data.photoUrl) && "resume-print-header-no-photo")}>
      {data.showPhoto && data.photoUrl ? (
        <div className="resume-photo-box">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={`${data.name || "候选人"} 简历照片`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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
                <span>{item.label}：</span>
                <span>{item.value}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ResumeEntry({ entry, sectionKey }: { entry: ResumeTemplateEntry; sectionKey: ResumeTemplateModel["sections"][number]["key"] }) {
  const shouldEmphasizeRole = sectionKey === "experience" || sectionKey === "projects" || sectionKey === "campus";

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
        <div className="resume-entry-org">{entry.title}</div>
        {entry.location ? <div className="resume-entry-location">{entry.location}</div> : null}
        {entry.subtitle ? <div className={cn("resume-entry-role", shouldEmphasizeRole && "resume-entry-role-strong")}>{entry.subtitle}</div> : null}
        {entry.date ? <div className="resume-entry-date">{entry.date}</div> : null}
        <div className="resume-entry-content">
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
    { label: "电话", value: data.phone },
    { label: "电子邮件", value: data.email },
    { label: "性别", value: data.gender },
    { label: "年龄", value: data.age },
    { label: "所在地", value: data.location },
    { label: "链接", value: data.website },
    { label: "社交", value: data.socialLinks }
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row?.value));
}
