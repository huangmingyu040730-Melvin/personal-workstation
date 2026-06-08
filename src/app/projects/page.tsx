import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicProjectCard } from "@/components/public/public-content-cards";
import { PublicEmptyState, PublicListToolbar, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { projectStatuses } from "@/lib/content-options";
import { getPublicProjects } from "@/lib/queries/projects";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "研究项目 | 黄铭语",
  description: "浏览黄铭语公开研究工作站中已公开的研究项目、研究问题、方法框架和阶段性进展。",
  path: "/projects"
});

export default async function PublicProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const projects = await getPublicProjects({ status, q });
  const hasActiveFilters = Boolean(q.trim()) || status !== "all";

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Research Projects"
        title="公开研究项目"
        description="浏览已公开的研究主题、进度、方法框架与阶段性沉淀。这里只展示明确设为公开的项目。"
      />
      <section className="mx-auto max-w-[1536px] px-5 py-10 lg:px-10 xl:px-12">
        <form className="mb-6 grid gap-3 rounded-3xl border border-earth-100 bg-white/[.82] p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-stone-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索项目标题、简介、标签..." className="h-10 w-full rounded-2xl border border-earth-100 bg-white pl-9 pr-3 text-sm text-earth-950 outline-none transition focus:border-earth-300" />
          </label>
          <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-earth-100 bg-white px-3 text-sm text-earth-950">
            <option value="all">全部状态</option>
            {projectStatuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button className="h-10 rounded-2xl bg-earth-900 px-5 text-sm font-semibold text-paper-50 transition hover:bg-earth-950">筛选</button>
        </form>
        <PublicListToolbar count={projects.length} active={hasActiveFilters} clearHref="/projects" label="公开项目" />

        {projects.length === 0 ? (
          <PublicEmptyState title="暂无公开研究项目" description="后续将逐步开放已整理完成的研究内容。你也可以清空筛选后查看全部公开项目。" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <PublicProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
