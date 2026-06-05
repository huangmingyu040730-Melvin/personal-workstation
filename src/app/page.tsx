import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, BrainCircuit, FileText, FolderKanban, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicSectionHeader, PublicShell } from "@/components/public/public-shell";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { profile } from "@/lib/mock-data";
import { countPublicKnowledgeNotes, getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { countPublicProjects, getFeaturedPublicProjects } from "@/lib/queries/projects";
import { countPublicPublications, getFeaturedPublicPublications } from "@/lib/queries/publications";
import { countPublicSkills, getFeaturedPublicSkills } from "@/lib/queries/skills";

export const metadata: Metadata = {
  title: "黄铭语的公开研究工作站",
  description: "黄铭语关于投资研究、量化分析、知识文章与 AI Skill 的公开只读研究工作站。"
};

function EmptyPublicState({ label }: { label: string }) {
  return (
    <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
      暂无{label}。
    </p>
  );
}

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
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-blue-50 text-blue-700 ring-blue-200">公开研究工作站</Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">{profile.name}</h1>
            <p className="mt-4 text-lg font-medium text-blue-700">投资研究、量化分析与 AI 工作流探索者</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              这里沉淀我的公开研究项目、学术成果、知识文章与 AI Skill。公开页面只展示明确设为 public 的内容，私密后台和文件资产保持隔离。
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["私募基金研究", "量化策略分析", "AI 辅助研究", "数据分析", "知识管理", "自动化工作流"].map((interest) => (
                <span key={interest} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  {interest}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/projects" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800">
                查看研究项目
                <ArrowRight size={18} />
              </Link>
              <Link href="/publications" className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                查看学术成果
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                管理员登录
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "公开项目", value: publicProjectCount, icon: FolderKanban },
              { title: "公开成果", value: publicPublicationCount, icon: FileText },
              { title: "公开 Skill", value: publicSkillCount, icon: Sparkles },
              { title: "公开文章", value: publicKnowledgeCount, icon: BookOpen }
            ].map((item) => (
              <Card key={item.title} className="p-5">
                <item.icon className="text-blue-700" size={26} />
                <p className="mt-6 text-3xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.title}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <PublicSectionHeader
          eyebrow="Selected Work"
          title="精选公开内容"
          description="这些内容来自真实 Supabase 数据，只展示公开且适合对外浏览的记录。"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
          <CardHeader title="精选公开项目" action={<Link href="/projects" className="text-sm font-semibold text-blue-700">全部项目</Link>} />
          <div className="space-y-4">
            {featuredProjects.length > 0 ? (
              featuredProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.slug}`} className="block rounded-2xl bg-slate-50 p-4 hover:bg-blue-50">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.summary}</p>
                </Link>
              ))
            ) : (
              <EmptyPublicState label="公开项目" />
            )}
          </div>
          </Card>
          <Card>
          <CardHeader title="精选公开成果" action={<Link href="/publications" className="text-sm font-semibold text-blue-700">全部成果</Link>} />
          <div className="space-y-4">
            {featuredPublications.length > 0 ? (
              featuredPublications.map((publication) => (
                <Link key={publication.id} href={`/publications/${publication.slug}`} className="block border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <p className="font-semibold text-slate-900">{publication.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{getPublicationTypeLabel(publication.publication_type)}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{publication.summary}</p>
                </Link>
              ))
            ) : (
              <EmptyPublicState label="公开成果" />
            )}
          </div>
          </Card>
          <Card>
          <CardHeader title="精选公开 Skill" action={<Link href="/skills" className="text-sm font-semibold text-blue-700">全部 Skill</Link>} />
          <div className="space-y-4">
            {featuredSkills.length > 0 ? (
              featuredSkills.map((skill) => (
                <Link key={skill.id} href={`/skills/${skill.slug}`} className="block rounded-2xl border border-slate-100 p-4 hover:border-blue-200">
                  <p className="font-semibold text-slate-900">{skill.name}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{skill.description}</p>
                </Link>
              ))
            ) : (
              <EmptyPublicState label="公开 Skill" />
            )}
          </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-12 lg:grid-cols-[1fr_0.42fr] lg:px-8">
        <Card>
          <CardHeader title="最近公开知识文章" action={<Link href="/knowledge" className="text-sm font-semibold text-blue-700">进入知识库</Link>} />
          <div className="grid gap-3 md:grid-cols-3">
            {recentKnowledge.length > 0 ? recentKnowledge.map((note) => (
              <Link key={note.id} href={`/knowledge/${note.slug}`} className="rounded-2xl bg-slate-50 p-4 hover:bg-emerald-50">
                <p className="font-semibold text-slate-900">{note.title}</p>
                <p className="mt-1 text-xs text-slate-500">{note.category} · {formatRelative(note.updated_at)}</p>
                {note.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{note.excerpt}</p> : null}
              </Link>
            )) : <div className="md:col-span-3"><EmptyPublicState label="公开知识文章" /></div>}
          </div>
        </Card>
        <Card>
          <CardHeader title="研究工作站边界" />
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p className="flex gap-2"><BrainCircuit className="mt-1 shrink-0 text-blue-700" size={17} />公开页面只展示明确设为 public 的内容。</p>
            <p>私密文件、内部日志、管理设置和内部日历不会出现在公开页面。</p>
            <p>未来会加入“申请查看受限内容”入口，但当前阶段不开放外部账号与审批。</p>
          </div>
        </Card>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold text-blue-700">About</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">了解这个公开研究工作站</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              这个网站对外展示公开研究，对内承载私密数字资产后台。你可以从这里进入研究项目、学术成果、Skill 和知识文章，也可以了解我的研究方向与后续规划。
            </p>
          </div>
          <Link href="/about" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800">
            <UserRound size={18} />
            关于我
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
