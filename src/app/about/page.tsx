import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, Database, ExternalLink, FileText, FolderKanban, Home, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicSectionHeader, PublicShell } from "@/components/public/public-shell";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "关于黄铭语",
  description: "了解黄铭语的研究方向、公开个人简介、公开研究工作站定位，以及公开内容和私密后台的边界。",
  path: "/about"
});

const publicEntrances = [
  { title: "研究项目", description: "公开研究主题、研究问题、方法框架与阶段性进展。", href: "/projects", icon: FolderKanban },
  { title: "学术成果", description: "公开研究报告、策略分析、论文草稿和阅读综述。", href: "/publications", icon: FileText },
  { title: "知识库", description: "公开笔记、方法整理、工具使用和阅读沉淀。", href: "/knowledge", icon: BookOpen },
  { title: "Skill 库", description: "面向研究、写作、数据和知识管理的公开 AI Skill / 工作流说明。", href: "/skills", icon: Sparkles }
];

const defaultResearchFocus = [
  {
    title: "金融与投资研究",
    description: "关注资产管理、策略阅读、行业信息整理和可复盘的研究框架。",
    icon: FileText,
    tone: "bg-blue-50 text-blue-700"
  },
  {
    title: "量化策略与数据分析",
    description: "整理因子、指标、回测思路和数据分析方法，保持审慎、可解释的研究记录。",
    icon: BarChart3,
    tone: "bg-sage-50 text-sage-700"
  },
  {
    title: "AI 工具与工作流自动化",
    description: "使用 Codex、ChatGPT 与可复用 Skill 改善研究、写作和资料整理流程。",
    icon: BrainCircuit,
    tone: "bg-violet-50 text-violet-700"
  },
  {
    title: "研究资产管理与知识沉淀",
    description: "把项目、成果、笔记、文件和工作流整理成长期可维护的个人知识系统。",
    icon: Database,
    tone: "bg-slate-100 text-slate-700"
  },
  {
    title: "公开研究工作站建设",
    description: "把适合展示的研究材料整理为公开页面，同时保留清晰的私密后台边界。",
    icon: ShieldCheck,
    tone: "bg-blue-100 text-blue-800"
  }
];

const workstationNotes = [
  { title: "展示公开研究项目", description: "用项目页记录问题意识、方法框架、阶段进展和相关成果。" },
  { title: "沉淀公开成果", description: "把报告、论文草稿、策略分析和阅读综述整理为可浏览的公开成果。" },
  { title: "整理知识笔记", description: "把工具方法、研究框架和阅读沉淀放入知识库，方便回看和引用。" },
  { title: "展示 AI Skill / 工作流", description: "Skill 页面只展示公开说明，不展示、不下载、不执行私密资料包。" },
  { title: "保护私密文件与后台资料", description: "私密文件默认留在后台；后台资料、内部文件地址和临时下载链接不进入公开页面。" },
  { title: "公开附件保持最小边界", description: "公开附件只出现在明确 public 的 Project / Publication 中，并经安全下载路由校验。" }
];

const toolGroups = [
  { title: "金融研究", items: ["投资研究", "资产管理", "策略阅读", "研究框架"] },
  { title: "数据分析", items: ["Python", "Excel", "Wind", "AkShare"] },
  { title: "公开站点工程", items: ["Next.js", "Supabase", "GitHub", "Vercel"] },
  { title: "AI 工作流", items: ["Codex", "ChatGPT", "Prompt Engineering", "自动化整理"] }
];

export default async function AboutPage() {
  const publicProfile = await getPublicProfile();
  const fallbackProfile = getProfileFallback();
  const profile = publicProfile ?? fallbackProfile;
  const hasPublicProfile = Boolean(publicProfile);
  const researchDirections = profile.research_interests.length > 0 ? profile.research_interests : fallbackProfile.research_interests;
  const skillTags = profile.skill_tags.length > 0 ? profile.skill_tags : fallbackProfile.skill_tags;
  const contactEntries = hasPublicProfile ? normalizePublicEntries(profile.contact ?? {}) : [];
  const socialEntries = hasPublicProfile ? normalizePublicEntries(profile.social_links ?? {}) : [];
  const heroDescription = profile.bio?.trim() || "我关注金融研究、量化分析、AI 工具和个人数字化工作台建设。这个公开研究工作站用于展示已经整理完成、适合对外分享的研究项目、学术成果、知识笔记和工作流说明。";
  const focusCards = defaultResearchFocus.map((item, index) => ({
    ...item,
    label: researchDirections[index] ?? item.title
  }));

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10 public-soft-grid opacity-80" />
        <div className="pointer-events-none absolute left-[-8%] top-[-38%] -z-10 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-42%] right-[12%] -z-10 h-80 w-80 rounded-full bg-sage-100/60 blur-3xl" />

        <div className="public-reveal mx-auto grid max-w-[1680px] gap-8 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:px-12 lg:py-16 2xl:px-16">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">About / Public Profile</p>
            <h1 className="public-display mt-4 max-w-5xl break-words text-4xl font-semibold leading-tight tracking-normal text-navy-950 md:text-6xl">
              {profile.display_name}
            </h1>
            <p className="mt-4 text-lg font-semibold leading-8 text-blue-700">
              {profile.headline ?? profile.role_title ?? "金融研究、量化分析、AI 工具与个人数字化工作台"}
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 md:text-lg md:leading-9">
              {heroDescription}
            </p>
            <div className="mt-6 flex max-w-4xl flex-wrap gap-2">
              {[profile.role_title, ...researchDirections].filter((item): item is string => Boolean(item)).slice(0, 6).map((item) => (
                <span key={item} className="max-w-full rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/projects" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                浏览研究项目
                <ArrowRight className="transition group-hover:translate-x-1" size={18} />
              </Link>
              <Link href="/publications" className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                浏览学术成果
                <ArrowRight className="transition group-hover:translate-x-1" size={18} />
              </Link>
              <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <Home size={17} />
                返回首页
              </Link>
            </div>
          </div>

          <Card className="border-slate-200 bg-white/90 shadow-[0_18px_56px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardHeader title="公开边界" description="这个页面只使用公开 Profile 字段和静态公开说明。" />
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>公开站点只展示明确设为 public 的内容。</p>
              <p>私密文件默认留在后台；只有明确 public 且关联 public Project / Publication 的文件才会出现在公开附件区。</p>
              <p>公开页面不提供外部授权入口；未公开内容继续只由管理员在后台管理。</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
        <PublicSectionHeader
          eyebrow="Research Focus"
          title="研究方向"
          description="这些方向会逐步映射到公开项目、成果、知识笔记和可复用工作流。"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {focusCards.map((item) => (
            <Card key={item.title} className="public-card-motion border-slate-200 bg-white shadow-soft">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                <item.icon size={21} />
              </div>
              <p className="mt-4 text-sm font-semibold text-blue-700">{item.label}</p>
              <h2 className="mt-2 text-lg font-semibold leading-7 text-navy-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-5 py-10 lg:grid-cols-[0.7fr_1.3fr] lg:px-12 lg:py-12 2xl:px-16">
          <div className="min-w-0">
            <PublicSectionHeader
              eyebrow="Workstation"
              title="这个站点是什么"
              description="它不是文件公开盘，也不是外部授权入口，而是一个可持续维护的公开研究入口。"
            />
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
              公开研究工作站承担作品集、研究索引和知识沉淀入口；私密文件、后台资料和未公开内容继续只由管理员在后台管理。
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workstationNotes.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-navy-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-12 2xl:px-16">
        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="个人简介" description="来自公开 Profile 字段；没有公开字段时使用保守默认文案。" />
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>{heroDescription}</p>
            {profile.education ? <p>{profile.education}</p> : null}
            {profile.role_title || profile.organization || profile.location ? (
              <dl className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
                {profile.role_title ? <div className="min-w-0"><dt className="text-xs font-semibold text-slate-400">定位</dt><dd className="mt-1 break-words font-medium text-slate-800">{profile.role_title}</dd></div> : null}
                {profile.organization ? <div className="min-w-0"><dt className="text-xs font-semibold text-slate-400">组织 / 机构</dt><dd className="mt-1 break-words font-medium text-slate-800">{profile.organization}</dd></div> : null}
                {profile.location ? <div className="min-w-0"><dt className="text-xs font-semibold text-slate-400">所在地</dt><dd className="mt-1 break-words font-medium text-slate-800">{profile.location}</dd></div> : null}
              </dl>
            ) : null}
          </div>
        </Card>

        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="Skills / Tools" description="偏向“关注、使用、构建、整理”的公开能力方向，不做夸张背书。" />
          <div className="grid gap-3 sm:grid-cols-2">
            {toolGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-navy-950">{group.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {skillTags.slice(0, 10).map((tag) => (
              <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">{tag}</span>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 pb-10 lg:px-12 2xl:px-16">
        <PublicSectionHeader eyebrow="Explore" title="公开内容导航" description="这些入口只展示 public 内容，不展示后台资料或私密文件。" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {publicEntrances.map((item) => (
            <Link key={item.href} href={item.href} className="public-card-motion group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft hover:border-blue-200">
              <item.icon className="text-blue-700 transition duration-300 group-hover:scale-110" size={22} />
              <p className="mt-4 font-semibold text-navy-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                进入浏览 <ArrowRight className="transition group-hover:translate-x-1" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 pb-14 lg:px-12 2xl:px-16">
        <Card className="public-card-motion border-slate-200 bg-white shadow-soft">
          <CardHeader title="Contact / Links" description="只展示管理员明确设置为 public 的公开 Profile 联系方式和链接。" />
          {contactEntries.length > 0 || socialEntries.length > 0 ? (
            <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
              {contactEntries.map(([label, value]) => (
                <ContactItem key={`${label}-${value}`} label={label} value={value} kind="contact" />
              ))}
              {socialEntries.map(([label, value]) => (
                <ContactItem key={`${label}-${value}`} label={label} value={value} kind="social" />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-slate-600">联系方式可后续在公开 Profile 中补充。当前公开页面不硬编码私人邮箱、Auth UUID、Supabase 配置或私密联系方式。</p>
          )}
        </Card>
      </section>
    </PublicShell>
  );
}

function normalizePublicEntries(entries: Record<string, string>) {
  return Object.entries(entries)
    .map(([label, value]) => [label.trim(), value.trim()] as const)
    .filter(([, value]) => value.length > 0 && value !== "待补充");
}

function ContactItem({
  label,
  value,
  kind
}: {
  label: string;
  value: string;
  kind: "contact" | "social";
}) {
  const href = getPublicContactHref(label, value);
  const Icon = kind === "contact" ? Mail : ExternalLink;

  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        <Icon size={14} />
        {label}
      </p>
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="mt-2 block break-all font-medium text-blue-700 hover:text-blue-800">
          {value}
        </a>
      ) : (
        <p className="mt-2 break-all font-medium text-slate-800">{value}</p>
      )}
    </div>
  );
}

function getPublicContactHref(label: string, value: string) {
  const normalizedLabel = label.toLowerCase();
  const normalizedValue = value.trim();

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  if ((normalizedLabel.includes("email") || normalizedLabel.includes("邮箱")) && normalizedValue.includes("@")) {
    return `mailto:${normalizedValue}`;
  }

  return null;
}
