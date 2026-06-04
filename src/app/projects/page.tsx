import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { StatusBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { Progress } from "@/components/progress";
import { PublicEmptyState, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { projectStatuses } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getPublicProjects } from "@/lib/queries/projects";

export default async function PublicProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const projects = await getPublicProjects({ status, q });

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Research Projects"
        title="公开研究项目"
        description="浏览已公开的研究主题、进度、方法框架与阶段性沉淀。这里只展示明确设为公开的项目。"
      />
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <form className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索项目标题、简介、标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </label>
          <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">全部状态</option>
            {projectStatuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button className="rounded-2xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">筛选</button>
        </form>

        {projects.length === 0 ? (
          <PublicEmptyState title="暂无公开项目" description="当前没有符合条件的公开研究项目，后续公开内容会显示在这里。" />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`} className="block">
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {project.is_featured ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">精选</span> : null}
                        <StatusBadge status={project.status} />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-950">{project.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.summary}</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-500">公开进度</span>
                      <span className="font-semibold text-slate-900">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500">更新于 {formatRelative(project.updated_at)}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">详情 <ArrowRight size={15} /></span>
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
