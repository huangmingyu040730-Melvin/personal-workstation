import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, BrainCircuit, FileText, FolderKanban, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicKnowledgeCard, PublicProjectCard, PublicPublicationCard, PublicSkillCard } from "@/components/public/public-content-cards";
import { PublicSectionHeader, PublicShell } from "@/components/public/public-shell";
import { profile } from "@/lib/mock-data";
import { countPublicKnowledgeNotes, getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { countPublicProjects, getFeaturedPublicProjects } from "@/lib/queries/projects";
import { countPublicPublications, getFeaturedPublicPublications } from "@/lib/queries/publications";
import { countPublicSkills, getFeaturedPublicSkills } from "@/lib/queries/skills";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "黄铭语的公开研究工作站",
  description: "黄铭语关于投资研究、量化分析、知识文章与 AI Skill 的公开只读研究工作站。",
  path: "/"
});

function EmptyPublicState({ label }: { label: string }) {
  return (
    <p className="rounded-2xl bg-earth-50 p-4 text-sm leading-6 text-stone-500">
      暂无{label}，后续会逐步开放已整理完成的公开内容。
    </p>
  );
}

const discoveryLinks = [
  { title: "按研究主题浏览", description: "从项目进入，沿着关联成果和知识文章理解一个研究方向。", href: "/projects", icon: FolderKanban },
  { title: "按成果类型浏览", description: "查看公开报告、策略分析、阅读综述和阶段性总结。", href: "/publications", icon: FileText },
  { title: "按工作流浏览", description: "了解已经整理成公开说明的 AI Skill 与 Codex 工作流。", href: "/skills", icon: Sparkles },
  { title: "按知识文章浏览", description: "阅读工具方法、研究框架和 AI 辅助研究边界。", href: "/knowledge", icon: BookOpen }
];

export default async function HomePage() {
  const [
    publicProjectCount,
    publicPublicationCount,
    publicSkillCount,
    publicKnowledgeCount,
    featuredProjects,
    featuredPublications,
    featuredSkills,
    recentKnowledge
  ] = await Promise.all([
    countPublicProjects(),
    countPublicPublications(),
    countPublicSkills(),
    countPublicKnowledgeNotes(),
    getFeaturedPublicProjects(2),
    getFeaturedPublicPublications(3),
    getFeaturedPublicSkills(3),
    getPublicKnowledgeNotes({ limit: 3 })
  ]);

  return (
    <PublicShell>
      <section className="finance-hero relative overflow-hidden border-b border-earth-100 bg-[#f8f0e7]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(85,52,31,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(85,52,31,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="public-reveal relative z-10 mx-auto grid max-w-[1536px] gap-12 px-5 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:px-10 lg:py-24 xl:px-12">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-earth-100 text-earth-800 ring-earth-200">公开研究工作站</Badge>
            <h1 className="max-w-5xl text-5xl font-semibold leading-tight tracking-normal text-earth-950 md:text-7xl">
              投资研究，量化分析与 AI 工作流探索者
            </h1>
            <p className="mt-5 text-lg font-medium text-earth-700">{profile.name} · 公开研究、学术成果、知识文章与 AI Skill</p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-stone-600 md:text-lg md:leading-9">
              这里沉淀我的公开研究项目、学术成果、知识文章与 AI Skill。公开页面只展示明确设为 public 的内容，私密后台和文件资产保持隔离。
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["私募基金研究", "量化策略分析", "AI 辅助研究", "数据分析", "知识管理", "自动化工作流"].map((interest) => (
                <span key={interest} className="rounded-full border border-earth-200 bg-white/70 px-3 py-1.5 text-sm text-stone-700">
                  {interest}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/projects" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-sage-900 px-5 py-3 text-sm font-semibold text-paper-50 shadow-sm transition hover:bg-earth-950">
                查看研究项目
                <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />
              </Link>
              <Link href="/publications" className="inline-flex items-center justify-center rounded-2xl border border-earth-200 bg-white/80 px-5 py-3 text-sm font-semibold text-earth-800 transition hover:border-earth-300 hover:bg-earth-50">
                查看学术成果
              </Link>
              <Link href="/skills" className="inline-flex items-center justify-center rounded-2xl border border-sage-600/20 bg-sage-50 px-5 py-3 text-sm font-semibold text-sage-700 transition hover:bg-sage-100">
                进入 Skill 库
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "公开项目", value: publicProjectCount, icon: FolderKanban, href: "/projects" },
              { title: "公开成果", value: publicPublicationCount, icon: FileText, href: "/publications" },
              { title: "公开 Skill", value: publicSkillCount, icon: Sparkles, href: "/skills" },
              { title: "公开文章", value: publicKnowledgeCount, icon: BookOpen, href: "/knowledge" }
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group block">
                <Card className="finance-card-pattern min-h-44 border-earth-100 bg-white/[.78] p-6 shadow-warm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-earth-300">
                  <item.icon className="text-earth-700" size={28} />
                  <p className="mt-8 text-4xl font-semibold text-earth-950">{item.value}</p>
                  <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-stone-600">{item.title}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-earth-800 opacity-80">
                      查看全部 <ArrowRight className="transition group-hover:translate-x-0.5" size={13} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 py-12 lg:px-10 xl:px-12">
        <PublicSectionHeader
          eyebrow="Selected Work"
          title="精选公开内容"
          description="这些内容来自真实 Supabase 数据，只展示公开且适合对外浏览的记录。"
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredProjects.length > 0 ? featuredProjects.map((project) => <PublicProjectCard key={project.id} project={project} />) : <Card><CardHeader title="精选公开项目" /><EmptyPublicState label="公开项目" /></Card>}
          {featuredPublications.length > 0 ? featuredPublications.map((publication) => <PublicPublicationCard key={publication.id} publication={publication} />) : <Card><CardHeader title="精选公开成果" /><EmptyPublicState label="公开成果" /></Card>}
          {featuredSkills.length > 0 ? featuredSkills.map((skill) => <PublicSkillCard key={skill.id} skill={skill} />) : <Card><CardHeader title="精选公开 Skill" /><EmptyPublicState label="公开 Skill" /></Card>}
        </div>
      </section>

      <section className="mx-auto max-w-[1536px] px-5 pb-12 lg:px-10 xl:px-12">
        <PublicSectionHeader
          eyebrow="Discover"
          title="从哪里开始浏览"
          description="公开站点按项目、成果、Skill 和知识文章组织，你可以根据当前关注的问题选择入口。"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {discoveryLinks.map((item) => (
            <Link key={item.href} href={item.href} className="finance-card-pattern group rounded-3xl border border-earth-100 bg-white/[.86] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-earth-300 hover:shadow-warm">
              <item.icon className="text-earth-700" size={22} />
              <p className="mt-4 font-semibold text-earth-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-earth-800">
                进入浏览 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1536px] gap-6 px-5 pb-14 lg:grid-cols-[1fr_0.42fr] lg:px-10 xl:px-12">
        <Card className="border-earth-100 bg-white/[.86] shadow-soft">
          <CardHeader title="最近公开知识文章" action={<Link href="/knowledge" className="text-sm font-semibold text-earth-800">进入知识库</Link>} />
          <div className="grid gap-3 md:grid-cols-3">
            {recentKnowledge.length > 0 ? recentKnowledge.map((note) => (
              <PublicKnowledgeCard key={note.id} note={note} />
            )) : <div className="md:col-span-3"><EmptyPublicState label="公开知识文章" /></div>}
          </div>
        </Card>
        <Card className="border-earth-100 bg-white/[.86] shadow-soft">
          <CardHeader title="研究工作站边界" />
          <div className="space-y-4 text-sm leading-7 text-stone-600">
            <p className="flex gap-2"><BrainCircuit className="mt-1 shrink-0 text-earth-700" size={17} />公开页面只展示明确设为 public 的内容。</p>
            <p>私密文件、内部日志、管理设置和内部日历不会出现在公开页面。</p>
            <p>如需查看未公开材料，可以提交访问申请；当前阶段仅记录申请和处理状态，不开放外部账号或自动授权。</p>
            <Link href="/access-request" className="inline-flex w-fit items-center gap-2 rounded-2xl border border-earth-200 bg-earth-50 px-4 py-2 text-sm font-semibold text-earth-800 transition hover:bg-earth-100">
              申请查看受限内容
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </section>

      <section className="border-t border-earth-100 bg-[#f6efe6]">
        <div className="mx-auto grid max-w-[1536px] gap-5 px-5 py-11 md:grid-cols-[1fr_auto] md:items-center lg:px-10 xl:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-earth-700">About</p>
            <h2 className="mt-2 text-2xl font-semibold text-earth-950">了解这个公开研究工作站</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              这个网站对外展示公开研究，对内承载私密数字资产后台。你可以从这里进入研究项目、学术成果、Skill 和知识文章，也可以了解我的研究方向与后续规划。
            </p>
          </div>
          <Link href="/about" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-earth-900 px-5 py-3 text-sm font-semibold text-paper-50 transition hover:bg-earth-950">
            <UserRound size={18} />
            关于我
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
