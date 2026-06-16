import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, VisibilityBadge } from "@/components/badge";
import { PublicContentGuidance } from "@/components/dashboard/public-content-guidance";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/progress";
import { assetModelDefinitions } from "@/lib/asset-model";
import { projectStatuses, visibilityOptions } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getProjects } from "@/lib/queries/projects";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const visibility = params.visibility ?? "all";
  const projects = await getProjects({ status, visibility });

  return (
    <AppShell>
      <AdminPageSurface>
      <PageHeader
        eyebrow="Research Projects"
        title="研究项目"
        description={assetModelDefinitions.project.definition}
        action={
          <Link href="/dashboard/projects/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
            <Plus size={16} />
            新建项目
          </Link>
        }
      />
      <PublicContentGuidance />
      <AdminSection>
      <form className="flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部状态</option>
          {projectStatuses.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select name="visibility" defaultValue={visibility} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部权限</option>
          {visibilityOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
      </form>
      </AdminSection>
      {projects.length === 0 ? (
        <AdminEmptyState title="还没有研究项目" description={assetModelDefinitions.project.emptyStateDescription} action={<Link href="/dashboard/projects/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建项目</Link>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
              <AdminContentCard key={project.id} href={`/dashboard/projects/${project.id}`} className="h-full hover:border-blue-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{project.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-500">项目进度</span>
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
                  <VisibilityBadge visibility={project.visibility} />
                </div>
              </AdminContentCard>
          ))}
        </div>
      )}
      </AdminPageSurface>
    </AppShell>
  );
}
