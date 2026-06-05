import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicSkillCard } from "@/components/public/public-content-cards";
import { PublicEmptyState, PublicListToolbar, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { skillStatuses } from "@/lib/content-options";
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
  const hasActiveFilters = Boolean(q.trim()) || status !== "all";

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
        <PublicListToolbar count={skills.length} active={hasActiveFilters} clearHref="/skills" />

        {skills.length === 0 ? (
          <PublicEmptyState title="暂无公开 Skill" description="后续会逐步开放适合对外展示的 AI Skill 与研究工作流。" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {skills.map((skill) => (
              <PublicSkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
