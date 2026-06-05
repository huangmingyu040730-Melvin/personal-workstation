import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bot, Layers3, Search } from "lucide-react";
import { StatusBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { PublicEmptyState, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { skillStatuses } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getPublicSkills } from "@/lib/queries/skills";

export const metadata: Metadata = {
  title: "Skill 库 | 黄铭语",
  description: "浏览黄铭语公开研究工作站中的公开 AI Skill 与研究、写作、数据分析工作流能力。"
};

export default async function PublicSkillsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const skills = await getPublicSkills({ status, q });

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="AI Skills"
        title="公开 Skill 库"
        description="浏览已公开的 AI 辅助研究、写作、数据分析和知识工作流 Skill。这里只展示适合公开的 Skill 信息。"
      />
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <form className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索 Skill 名称、说明、平台..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </label>
          <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">全部状态</option>
            {skillStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button className="h-10 rounded-2xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">筛选</button>
        </form>

        {skills.length === 0 ? (
          <PublicEmptyState title="暂无公开 Skill" description="当前没有符合条件的公开 Skill。" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {skills.map((skill) => (
              <Link key={skill.id} href={`/skills/${skill.slug}`} className="block">
                <Card className="relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-blue-100 to-violet-100" />
                  <div className="relative">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
                          <Bot size={22} />
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            {skill.is_featured ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">精选</span> : null}
                            <StatusBadge status={skill.status} />
                          </div>
                          <h2 className="text-lg font-semibold text-slate-950">{skill.name}</h2>
                          <p className="mt-1 text-sm text-slate-500">{skill.category}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{skill.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {skill.platforms.map((platform) => (
                        <span key={platform} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          <Layers3 size={12} />
                          {platform}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-500">{skill.current_version ?? "未设版本"} · {formatRelative(skill.updated_at)}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">详情 <ArrowRight size={15} /></span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
