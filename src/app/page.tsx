import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, FileText, FolderKanban, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { HomeSection } from "@/components/home/home-section";
import { PublicKnowledgeCard, PublicProjectCard, PublicPublicationCard, PublicSkillCard } from "@/components/public/public-content-cards";
import { PublicShell } from "@/components/public/public-shell";
import { countPublicKnowledgeNotes, getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { countPublicProjects, getPublicProjects } from "@/lib/queries/projects";
import { countPublicPublications, getPublicPublications } from "@/lib/queries/publications";
import { countPublicSkills, getPublicSkills } from "@/lib/queries/skills";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "黄铭语研究工作站 | Public Research Workstation",
  description: "沉淀研究项目、学术成果、知识笔记和 AI 工作流的个人研究空间。",
  path: "/"
});

function EmptyPublicState({ label }: { label: string }) {
  return (
    <p className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-500">
      暂无{label}，后续会逐步开放已整理完成的公开内容。
    </p>
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
  const knowledgePreviews = publicKnowledge.slice(0, 2);
  const skillPreviews = publicSkills.slice(0, 2);

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <Image
          src="/research-workstation-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/85" />
        <div className="public-reveal-slow relative z-10 mx-auto max-w-[1680px] px-5 py-14 lg:px-12 lg:py-20 2xl:px-16">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase text-sage-700">MINGYU RESEARCH WORKSTATION</p>
            <h1 className="public-serif-display mt-4 max-w-4xl text-5xl font-medium leading-tight text-navy-950 md:text-7xl">
              黄铭语研究工作站
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-lg md:leading-9">
              沉淀研究项目、学术成果、知识笔记与 AI 工作流的个人研究空间。这里展示明确设为 public 的内容，私密文件、后台关系和内部管理数据保持隔离。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/projects" className="public-cta-motion group inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800">
                浏览研究项目
                <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />
              </Link>
              <Link href="/publications" className="public-cta-motion inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100">
                查看学术成果
                <ArrowRight size={18} />
              </Link>
              <Link href="/access-request" className="public-cta-motion inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
                申请访问
                <KeyRound size={18} />
              </Link>
            </div>
            <dl className="mt-9 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-4 border-y border-slate-200/80 py-5 text-sm sm:grid-cols-4">
              {[
                { label: "公开项目", value: publicProjectCount },
                { label: "学术成果", value: publicPublicationCount },
                { label: "知识笔记", value: publicKnowledgeCount },
                { label: "公开 Skill", value: publicSkillCount }
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-slate-500">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-navy-950">{item.value}</dd>
                </div>
              ))}
            </dl>
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
        <div className="grid gap-5 md:grid-cols-2">
          {knowledgePreviews.length > 0 ? knowledgePreviews.map((note) => (
            <PublicKnowledgeCard key={note.id} note={note} />
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
        <div className="grid gap-5 md:grid-cols-2">
          {skillPreviews.length > 0 ? skillPreviews.map((skill) => (
            <PublicSkillCard key={skill.id} skill={skill} />
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
              部分内容可能保持 restricted 或 private。公开站点不提供附件下载，不生成临时下载链接，也不展示文件路径或内部管理信息。
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
