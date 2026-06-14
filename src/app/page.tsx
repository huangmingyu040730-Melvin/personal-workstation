import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, BarChart3, BookOpen, Bot, BrainCircuit, FileText, FolderKanban, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/card";
import { HomeSection } from "@/components/home/home-section";
import { PublicShell } from "@/components/public/public-shell";
import type { KnowledgeNoteRecord, ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import { getPublicationTypeLabel } from "@/lib/content-options";
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

function EmptyPublicState({
  label,
  description,
  href
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
      <p className="font-semibold text-navy-950">{label}正在整理中</p>
      <p className="mt-1">{description}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-700">
        进入栏目 <ArrowRight size={14} />
      </Link>
    </div>
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

type FeaturedReason = "featured" | "recent";
type FeatureSelection<T> = {
  item: T;
  reason: FeaturedReason;
};

const projectStatusLabels: Record<ProjectRecord["status"], string> = {
  planning: "规划中",
  in_progress: "进行中",
  completed: "已完成",
  archived: "已归档"
};

function selectFeaturedThenRecent<T extends { is_featured: boolean; updated_at: string }>(items: T[], limit: number): FeatureSelection<T>[] {
  return [...items]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit)
    .map((item) => ({
      item,
      reason: item.is_featured ? "featured" : "recent"
    }));
}

function FeatureReasonPill({ reason }: { reason: FeaturedReason }) {
  const label = reason === "featured" ? "精选" : "最近更新";
  const tone = reason === "featured" ? "bg-violet-50 text-violet-700 ring-violet-100" : "bg-slate-100 text-slate-600 ring-slate-200";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}>{label}</span>;
}

function HomeFeatureCard({
  href,
  title,
  summary,
  meta,
  tags,
  reason,
  icon: Icon,
  actionLabel
}: {
  href: string;
  title: string;
  summary: string | null;
  meta: string;
  tags: string[];
  reason: FeaturedReason;
  icon: typeof FolderKanban;
  actionLabel: string;
}) {
  return (
    <Link href={href} className="group block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:border-blue-200 hover:shadow-[0_16px_42px_rgba(15,42,88,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
          <Icon size={18} />
        </span>
        <FeatureReasonPill reason={reason} />
      </div>
      <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-6 text-navy-950">{title}</h3>
      <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-500">{meta}</p>
      {summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{summary}</p> : null}
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
        {actionLabel} <ArrowRight className="transition duration-300 group-hover:translate-x-1" size={14} />
      </span>
    </Link>
  );
}

function FeaturedContentColumn({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
  children,
  empty
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  children: ReactNode;
  empty: ReactNode;
}) {
  const hasItems = Boolean(children);

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-h-[124px] flex-col justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold text-navy-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
          {actionLabel} <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid gap-4">
        {hasItems ? children : empty}
      </div>
    </div>
  );
}

function ProjectFeatureCards({ items }: { items: FeatureSelection<ProjectRecord>[] }) {
  return (
    <>
      {items.map(({ item, reason }) => (
        <HomeFeatureCard
          key={item.id}
          href={`/projects/${item.slug}`}
          title={item.title}
          summary={item.summary}
          meta={`${projectStatusLabels[item.status]} · 更新于 ${formatRelative(item.updated_at)}`}
          tags={item.tags}
          reason={reason}
          icon={FolderKanban}
          actionLabel="查看项目"
        />
      ))}
    </>
  );
}

function PublicationFeatureCards({ items }: { items: FeatureSelection<PublicationRecord>[] }) {
  return (
    <>
      {items.map(({ item, reason }) => (
        <HomeFeatureCard
          key={item.id}
          href={`/publications/${item.slug}`}
          title={item.title}
          summary={item.summary}
          meta={`${getPublicationTypeLabel(item.publication_type)} · 更新于 ${formatRelative(item.updated_at)}`}
          tags={item.tags}
          reason={reason}
          icon={FileText}
          actionLabel="查看成果"
        />
      ))}
    </>
  );
}

function KnowledgeFeatureCards({ items }: { items: FeatureSelection<KnowledgeNoteRecord>[] }) {
  return (
    <>
      {items.map(({ item, reason }) => (
        <HomeFeatureCard
          key={item.id}
          href={`/knowledge/${item.slug}`}
          title={item.title}
          summary={item.excerpt}
          meta={`${item.category} · 更新于 ${formatRelative(item.updated_at)}`}
          tags={item.tags}
          reason={reason}
          icon={BookOpen}
          actionLabel="阅读笔记"
        />
      ))}
    </>
  );
}

function SkillFeatureCards({ items }: { items: FeatureSelection<SkillRecord>[] }) {
  return (
    <>
      {items.map(({ item, reason }) => (
        <HomeFeatureCard
          key={item.id}
          href={`/skills/${item.slug}`}
          title={item.name}
          summary={item.description}
          meta={`${item.category} · ${item.current_version ?? "公开说明"}`}
          tags={item.platforms}
          reason={reason}
          icon={Bot}
          actionLabel="查看 Skill"
        />
      ))}
    </>
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
    getPublicKnowledgeNotes()
  ]);
  const projectPreviews = selectFeaturedThenRecent(publicProjects, 2);
  const publicationPreviews = selectFeaturedThenRecent(publicPublications, 2);
  const knowledgePreviews = selectFeaturedThenRecent(publicKnowledge, 4);
  const skillPreviews = selectFeaturedThenRecent(publicSkills, 4);
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
              <Link href="/about" className="public-cta-motion group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                关于我
                <ArrowRight className="transition duration-300 group-hover:translate-x-1" size={18} />
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
        eyebrow="About"
        title="关于这个工作站"
        description="这里是公开研究主页和作品集入口，面向访客展示已整理完成的 public 内容；私密文件、后台资料和内部管理信息继续留在管理员工作区。"
        action={<Link href="/about" className="text-sm font-semibold text-blue-700">关于我</Link>}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-950 text-white">
              <ShieldCheck size={22} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-navy-950">Public showcase + admin-only private workspace</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              首页负责把公开项目、成果、知识笔记和 Skill / 工作流组织成清晰浏览路径；未公开内容不会进入首页、列表页或 sitemap。
            </p>
            <Link href="/about" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              了解公开边界 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "只展示 public 内容", description: "首页精选区只来自公开查询返回的记录，并优先使用后台标记的精选内容。" },
              { title: "私密资料留在后台", description: "文件中心、内部备注、后台关系管理和未公开素材不会作为访客入口出现。" },
              { title: "公开附件保持克制", description: "只有 public Project / Publication 的显式公开附件，才会在对应详情页展示安全下载入口。" }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold leading-6 text-navy-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </HomeSection>

      <HomeSection
        surface="muted"
        eyebrow="Featured"
        title="精选内容与最新公开记录"
        description="首页优先展示后台标记为 featured 的 public 内容；当精选不足时，用最近更新的 public 记录补足，保持访客浏览路径完整。"
      >
        <div className="grid gap-8 lg:grid-cols-2 2xl:grid-cols-4">
          <FeaturedContentColumn
            eyebrow="Projects"
            title="精选研究项目"
            description="从研究问题、方法框架和阶段进度进入公开研究脉络。"
            href="/projects"
            actionLabel="全部项目"
            empty={<EmptyPublicState label="公开项目" description="公开内容正在整理中，后续会逐步开放适合展示的研究项目。" href="/projects" />}
          >
            {projectPreviews.length > 0 ? <ProjectFeatureCards items={projectPreviews} /> : null}
          </FeaturedContentColumn>
          <FeaturedContentColumn
            eyebrow="Publications"
            title="精选学术成果"
            description="浏览公开报告、论文草稿、策略分析和阅读综述。"
            href="/publications"
            actionLabel="全部成果"
            empty={<EmptyPublicState label="公开成果" description="公开成果正在整理中，后续会补充适合外部阅读的摘要与材料说明。" href="/publications" />}
          >
            {publicationPreviews.length > 0 ? <PublicationFeatureCards items={publicationPreviews} /> : null}
          </FeaturedContentColumn>
          <FeaturedContentColumn
            eyebrow="Knowledge"
            title="最新知识笔记"
            description="沉淀研究框架、工具方法、阅读笔记和实践反思。"
            href="/knowledge"
            actionLabel="进入知识库"
            empty={<EmptyPublicState label="公开知识笔记" description="知识笔记正在整理中，后续会开放完成脱敏和摘要化的公开内容。" href="/knowledge" />}
          >
            {knowledgePreviews.length > 0 ? <KnowledgeFeatureCards items={knowledgePreviews} /> : null}
          </FeaturedContentColumn>
          <FeaturedContentColumn
            eyebrow="Skills"
            title="公开 Skill / 工作流"
            description="展示 AI Skill、工具链和研究工作流的公开说明。"
            href="/skills"
            actionLabel="进入 Skill 库"
            empty={<EmptyPublicState label="公开 Skill" description="Skill 与工作流说明正在整理中，后续会补充可公开复用的方法卡片。" href="/skills" />}
          >
            {skillPreviews.length > 0 ? <SkillFeatureCards items={skillPreviews} /> : null}
          </FeaturedContentColumn>
        </div>
      </HomeSection>

      <section className="border-t border-slate-200 bg-navy-950 text-white">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-5 py-12 lg:grid-cols-[minmax(0,0.8fr)_auto] lg:items-center lg:px-12 2xl:px-16">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-sage-100">
              <ShieldCheck size={17} />
              Public Boundary
            </p>
            <h2 className="public-display mt-3 text-2xl font-semibold tracking-normal md:text-3xl">公开内容边界清晰可控</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
              公开站点只展示明确设为 public 的内容和公开附件。private 与 unlisted 内容继续留在管理员后台，不展示私密文件、内部文件地址、临时访问地址或内部管理信息。
            </p>
          </div>
          <Link href="/about" className="public-cta-motion inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-blue-50">
            了解工作站边界
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
