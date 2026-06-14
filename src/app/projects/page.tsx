import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicProjectCard } from "@/components/public/public-content-cards";
import { buildPublicListingHref, PublicFilterChipGroup, PublicListingControls, PublicListingEmptyState, PublicListingHero } from "@/components/public/public-listing-shell";
import { PublicShell } from "@/components/public/public-shell";
import type { ProjectRecord } from "@/lib/content-types";
import { projectStatuses } from "@/lib/content-options";
import { getPublicProjects } from "@/lib/queries/projects";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "研究项目",
  description: "浏览公开研究项目、研究问题、方法框架和阶段性进展。",
  path: "/projects"
});

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesProjectKeyword(project: ProjectRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  return [project.title, project.summary, project.background, project.research_question, project.methodology, project.status, ...(project.tags ?? [])]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN")
    .includes(keyword);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export default async function PublicProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = params.status ?? "all";
  const tag = params.tag ?? "all";
  const featured = params.featured === "featured" ? "featured" : "all";
  const currentFilters = { q, status, tag, featured };
  const allProjects = await getPublicProjects();
  const tags = uniqueSorted(allProjects.flatMap((project) => project.tags ?? []));
  const projects = allProjects
    .filter((project) => status === "all" || project.status === status)
    .filter((project) => tag === "all" || project.tags.includes(tag))
    .filter((project) => featured === "all" || project.is_featured)
    .filter((project) => matchesProjectKeyword(project, q));
  const hasActiveFilters = Boolean(q.trim()) || status !== "all" || tag !== "all" || featured !== "all";

  return (
    <PublicShell>
      <PublicListingHero
        eyebrow="Research Projects"
        title="公开研究项目"
        description="以研究问题、方法框架和阶段性沉淀组织公开项目。这里只展示明确设为 public 的项目，私密附件和后台关系仍保持隔离。"
        stats={[
          { label: "公开项目", value: allProjects.length },
          { label: "精选项目", value: allProjects.filter((project) => project.is_featured).length },
          { label: "筛选结果", value: projects.length },
          { label: "标签维度", value: tags.length }
        ]}
      />
      <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
        <PublicListingControls count={projects.length} active={hasActiveFilters} clearHref="/projects" label="公开项目">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
            {tag !== "all" ? <input type="hidden" name="tag" value={tag} /> : null}
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
              <input name="q" defaultValue={q} placeholder="搜索项目标题、简介、标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-blue-300" />
            </label>
            <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="all">全部状态</option>
              {projectStatuses.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select name="featured" defaultValue={featured} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="all">全部内容</option>
              <option value="featured">仅看精选</option>
            </select>
            <button className="h-10 rounded-2xl bg-navy-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-800">浏览</button>
          </form>
          <PublicFilterChipGroup
            label="按标签浏览"
            options={[
              { label: "全部标签", href: buildPublicListingHref("/projects", currentFilters, { tag: "all" }), active: tag === "all" },
              ...tags.map((item) => ({ label: item, href: buildPublicListingHref("/projects", currentFilters, { tag: item }), active: tag === item }))
            ]}
          />
        </PublicListingControls>

        {projects.length === 0 ? (
          <PublicListingEmptyState title="暂无符合条件的公开研究项目" description="当前筛选没有匹配的 public 项目。可以清空筛选，或通过访问申请说明你希望查看的研究方向。" actionHref="/projects" actionLabel="清空筛选" />
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
