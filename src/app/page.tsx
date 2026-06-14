import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ArrowRight, BarChart3, BookOpen, Bot, BrainCircuit, FileText, FolderKanban, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { HomeSection } from "@/components/home/home-section";
import { PublicProjectCard, PublicPublicationCard } from "@/components/public/public-content-cards";
import { PublicShell } from "@/components/public/public-shell";
import type { KnowledgeNoteRecord, SkillRecord } from "@/lib/content-types";
import { formatRelative } from "@/lib/format";
import { countPublicKnowledgeNotes, getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { countPublicProjects, getPublicProjects } from "@/lib/queries/projects";
import { countPublicPublications, getPublicPublications } from "@/lib/queries/publications";
import { countPublicSkills, getPublicSkills } from "@/lib/queries/skills";
import { publicPageMetadata, siteName } from "@/lib/site";

const homeMetadata = publicPageMetadata({
  title: "个人研究工作站",
  description: "公开研究项目、学术成果、知识笔记与 AI 工作流。",
  path: "/"
});

export const metadata: Metadata = {
  ...homeMetadata,
  title: {
    absolute: `个人研究工作站 | ${siteName}`
  }
};

function EmptyPublicState({ label }: { label: string }) {
  return (
    <p className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-500">
      暂无{label}，后续会逐步开放已整理完成的公开内容。
    </p>
  );
}

const heroCandles = [
  { height: "34%", offset: "14%", tone: "up" },
  { height: "52%", offset: "28%", tone: "down" },
  { height: "43%", offset: "22%", tone: "up" },
  { height: "68%", offset: "18%", tone: "up" },
  { height: "38%", offset: "35%", tone: "down" },
  { height: "57%", offset: "24%", tone: "up" },
  { height: "46%", offset: "31%", tone: "down" },
  { height: "72%", offset: "16%", tone: "up" }
];

function HeroResearchBackdrop() {
  return (
    <div aria-hidden="true" className="public-hero-research-backdrop">
      <div className="public-hero-formula public-hero-formula-top">α β Sharpe IR Factor Risk</div>
      <div className="public-hero-formula public-hero-formula-bottom">R = α + βF + ε</div>
      <div className="public-hero-paper-panel public-hero-paper-primary">
        <span />
        <span />
        <span />
      </div>
      <div className="public-hero-paper-panel public-hero-paper-secondary">
        <span />
        <span />
      </div>
      <div className="public-hero-candles">
        {heroCandles.map((candle, index) => (
          <span
            key={`${candle.height}-${index}`}
            className={candle.tone === "up" ? "is-up" : "is-down"}
            style={{ "--candle-height": candle.height, "--candle-offset": candle.offset } as CSSProperties}
          />
        ))}
      </div>
      <div className="public-hero-scatter" />
      <div className="public-hero-frontier" />
    </div>
  );
}

function HeroStatCard({
  href,
  icon: Icon,
  label,
  value,
  tone
}: {
  href: string;
  icon: typeof FolderKanban;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Link href={href} className="public-stat-card group/stat relative block overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      <div className="flex items-start justify-between gap-4">
        <div className={`public-stat-icon relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl ${tone} transition duration-300 group-hover/stat:rotate-3 group-hover/stat:scale-110`}>
          <Icon size={21} />
        </div>
        <ArrowRight className="mt-1 text-slate-300 transition duration-300 group-hover/stat:translate-x-1 group-hover/stat:text-blue-700" size={18} />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-normal text-navy-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
        查看全部 <ArrowRight className="transition duration-300 group-hover/stat:translate-x-1" size={14} />
      </span>
    </Link>
  );
}

function CompactKnowledgePreviewCard({ note }: { note: KnowledgeNoteRecord }) {
  return (
    <Link href={`/knowledge/${note.slug}`} className="public-compact-card group block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
          <BookOpen size={17} />
        </span>
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-semibold leading-6 text-navy-950">{note.title}</h2>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{note.category} · 更新于 {formatRelative(note.updated_at)}</p>
        </div>
      </div>
      {note.excerpt ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{note.excerpt}</p> : null}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="truncate text-xs text-slate-500">{note.tags.slice(0, 2).join(" / ") || "公开知识笔记"}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700">
          阅读 <ArrowRight className="transition duration-300 group-hover:translate-x-1" size={14} />
        </span>
      </div>
    </Link>
  );
}

function CompactSkillPreviewCard({ skill }: { skill: SkillRecord }) {
  return (
    <Link href={`/skills/${skill.slug}`} className="public-compact-card group block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-white transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
          <Bot size={17} />
        </span>
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-semibold leading-6 text-navy-950">{skill.name}</h2>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{skill.category} · {skill.current_version ?? "未设版本"}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{skill.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="truncate text-xs text-slate-500">{skill.platforms.slice(0, 2).join(" / ") || "公开 Skill"}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700">
          详情 <ArrowRight className="transition duration-300 group-hover:translate-x-1" size={14} />
        </span>
      </div>
    </Link>
  );
}

const researchFocusAreas = [
  {
    title: "AI 与个人工作流",
    description: "把 Codex、AI Skill 和自动化流程沉淀为可复用的研究与写作工作方法。",
    tags: ["AI Skill", "自动化", "工作流"],
    icon: BrainCircuit,
    tone: "bg-blue-50 text-blue-700"
  },
  {
    title: "金融研究与市场分析",
    description: "围绕投资研究、策略阅读和行业信息整理建立可追踪的公开研究记录。",
    tags: ["投资研究", "策略分析", "研究框架"],
    icon: FileText,
    tone: "bg-earth-50 text-earth-700"
  },
  {
    title: "量化与数据分析",
    description: "把数据处理、指标拆解和分析方法整理为项目、成果和知识笔记。",
    tags: ["数据分析", "指标", "量化"],
    icon: BarChart3,
    tone: "bg-sage-50 text-sage-700"
  },
  {
    title: "知识管理与研究资产",
    description: "用 Projects、Publications、Knowledge 和 Skills 组织长期研究资产。",
    tags: ["知识库", "研究资产", "沉淀"],
    icon: BookOpen,
    tone: "bg-slate-100 text-slate-700"
  }
];

const workstationEntrypoints = [
  { title: "研究项目", description: "从研究问题、方法框架和阶段进度进入。", href: "/projects", icon: FolderKanban },
  { title: "学术成果", description: "浏览公开报告、论文草稿、策略分析和阅读综述。", href: "/publications", icon: FileText },
  { title: "知识库", description: "阅读公开知识笔记、工具方法和研究框架。", href: "/knowledge", icon: BookOpen },
  { title: "Skill 库", description: "查看公开 AI Skill 与研究工作流说明。", href: "/skills", icon: Sparkles }
];

const heroTags = ["私募基金研究", "量化策略分析", "AI 辅助研究", "数据分析", "知识管理", "自动化工作流"];

export default async function HomePage() {
  const [
    publicProjectCount,
    publicPublicationCount,
    publicSkillCount,
    publicKnowledgeCount,
    publicProjects,
    publicPublications,
    publicSkills,
    publicKnowledge
  ] = await Promise.all([
    countPublicProjects(),
    countPublicPublications(),
    countPublicSkills(),
    countPublicKnowledgeNotes(),
    getPublicProjects(),
    getPublicPublications(),
    getPublicSkills(),
    getPublicKnowledgeNotes({ limit: 4 })
  ]);
  const projectPreviews = publicProjects.slice(0, 2);
  const publicationPreviews = publicPublications.slice(0, 2);
  const knowledgePreviews = publicKnowledge.slice(0, 4);
  const skillPreviews = publicSkills.slice(0, 4);
  const heroStats = [
    { label: "公开项目", value: publicProjectCount, href: "/projects", icon: FolderKanban, tone: "bg-blue-50 text-blue-700" },
    { label: "公开成果", value: publicPublicationCount, href: "/publications", icon: FileText, tone: "bg-earth-50 text-earth-700" },
    { label: "公开 Skill", value: publicSkillCount, href: "/skills", icon: Sparkles, tone: "bg-navy-950 text-white" },
    { label: "知识笔记", value: publicKnowledgeCount, href: "/knowledge", icon: BookOpen, tone: "bg-sage-50 text-sage-700" }
  ];

  return (
    <PublicShell>
      <section className="public-hero-shell relative overflow-hidden border-b border-slate-200 bg-white">
        <Image
          src="/research-workstation-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/88 to-white/90" />
        <div className="absolute inset-0 public-soft-grid opacity-70" />
        <HeroResearchBackdrop />
        <div className="public-reveal-slow relative z-10 mx-auto grid max-w-[1680px] gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)] lg:items-center lg:px-12 lg:py-20 2xl:px-16">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase text-sage-700">MINGYU RESEARCH WORKSTATION</p>
            <h1 className="public-research-title mt-4 max-w-4xl text-5xl font-semibold leading-tight text-navy-950 md:text-7xl">
              个人研究工作站
            </h1>
            <p className="mt-4 text-lg font-semibold leading-8 text-blue-700 md:text-xl">
              投资研究、量化分析与 AI 工作流探索者
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 md:text-lg md:leading-9">
              这里沉淀我的公开研究项目、学术成果、知识笔记与 AI Skill。公开页面只展示明确设为 public 的内容，私密后台和文件资产保持隔离。
            </p>
            <div className="mt-6 flex max-w-3xl flex-wrap gap-2.5">
              {heroTags.map((tag) => (
                <span key={tag} className="public-chip-motion rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/projects" className="public-cta-motion group inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                查看研究项目
                <ArrowRight className="transition duration-300 group-hover:translate-x-1" size={18} />
              </Link>
              <Link href="/publications" className="public-cta-motion group inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                查看学术成果
                <ArrowRight className="transition duration-300 group-hover:translate-x-1" size={18} />
              </Link>
              <Link href="/skills" className="public-cta-motion group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                进入 Skill 库
                <Sparkles className="transition duration-300 group-hover:rotate-6 group-hover:scale-105" size={18} />
              </Link>
              <Link href="/access-request" className="public-cta-motion group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                申请访问
                <KeyRound className="transition duration-300 group-hover:-rotate-6 group-hover:scale-105" size={18} />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {heroStats.map((item) => (
              <HeroStatCard key={item.label} {...item} />
            ))}
          </div>
        </div>
      </section>

      <HomeSection
        surface="white"
        eyebrow="Research Focus"
        title="研究方向"
        description="公开站点把长期关注的问题拆成可浏览的项目、成果、知识笔记和工作流。"
      >
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {researchFocusAreas.map((area) => (
            <Card key={area.title} className="public-card-motion border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${area.tone}`}>
                <area.icon size={22} />
              </div>
              <h2 className="mt-5 text-lg font-semibold leading-7 text-navy-950">{area.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{area.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {area.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </HomeSection>

      <HomeSection
        surface="muted"
        eyebrow="Browse"
        title="公开入口"
        description="首页只给外部访客提供公开研究内容入口，不展示后台菜单、关系管理、附件下载或私密材料。"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {workstationEntrypoints.map((item) => (
            <Link key={item.href} href={item.href} className="public-card-motion group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
              <item.icon className="text-blue-700 transition duration-300 group-hover:scale-110" size={22} />
              <p className="mt-4 font-semibold text-navy-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                进入浏览 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </HomeSection>

      <HomeSection
        surface="white"
        eyebrow="Selected Work"
        title="公开项目与学术成果"
        description="优先展示精选或最近更新的 public 记录；不展示附件下载或内部文件路径。"
      >
        <div className="grid gap-10 xl:grid-cols-2 xl:divide-x xl:divide-slate-200">
          <div className="xl:pr-10">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Projects</p>
                <h2 className="mt-1 text-xl font-semibold text-navy-950">研究项目</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">从研究问题、方法框架和阶段进度进入公开研究脉络。</p>
              </div>
              <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                全部项目 <ArrowRight size={15} />
              </Link>
            </div>
            {projectPreviews.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {projectPreviews.map((project) => <PublicProjectCard key={project.id} project={project} />)}
              </div>
            ) : (
              <Card><CardHeader title="公开项目" /><EmptyPublicState label="公开项目" /></Card>
            )}
          </div>
          <div className="xl:pl-10">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Publications</p>
                <h2 className="mt-1 text-xl font-semibold text-navy-950">学术成果</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">浏览公开报告、论文草稿、策略分析和阅读综述。</p>
              </div>
              <Link href="/publications" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                全部成果 <ArrowRight size={15} />
              </Link>
            </div>
            {publicationPreviews.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {publicationPreviews.map((publication) => <PublicPublicationCard key={publication.id} publication={publication} />)}
              </div>
            ) : (
              <Card><CardHeader title="公开成果" /><EmptyPublicState label="公开成果" /></Card>
            )}
          </div>
        </div>
      </HomeSection>

      <HomeSection
        surface="muted"
        eyebrow="Knowledge"
        title="知识笔记预览"
        description="公开知识库沉淀研究框架、工具方法、阅读笔记和实践反思。"
        action={<Link href="/knowledge" className="text-sm font-semibold text-blue-700">进入知识库</Link>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {knowledgePreviews.length > 0 ? knowledgePreviews.map((note) => (
            <CompactKnowledgePreviewCard key={note.id} note={note} />
          )) : <EmptyPublicState label="公开知识笔记" />}
        </div>
      </HomeSection>

      <HomeSection
        surface="white"
        eyebrow="Skills"
        title="Skill / 工作流预览"
        description="公开 Skill 只展示用途、平台和工作流说明，不开放后台资料包或私密文件。"
        action={<Link href="/skills" className="text-sm font-semibold text-blue-700">进入 Skill 库</Link>}
        innerClassName="pb-16"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {skillPreviews.length > 0 ? skillPreviews.map((skill) => (
            <CompactSkillPreviewCard key={skill.id} skill={skill} />
          )) : <EmptyPublicState label="公开 Skill" />}
        </div>
      </HomeSection>

      <section className="border-t border-slate-200 bg-navy-950 text-white">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-5 py-12 lg:grid-cols-[minmax(0,0.8fr)_auto] lg:items-center lg:px-12 2xl:px-16">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-sage-100">
              <ShieldCheck size={17} />
              Public Boundary
            </p>
            <h2 className="public-display mt-3 text-2xl font-semibold tracking-normal md:text-3xl">需要更多材料时，通过访问申请处理</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
              部分内容可能保持 restricted 或 private。公开站点只展示明确设为 public 的内容和公开附件，不展示私密文件、内部文件地址、临时访问地址或内部管理信息。
            </p>
          </div>
          <Link href="/access-request" className="public-cta-motion inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-blue-50">
            提交访问申请
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
