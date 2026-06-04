import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/progress";
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
      <PageHeader
        eyebrow="Research Projects"
        title="研究项目"
        description="从 Supabase 读取真实项目数据，管理研究主题、进度、里程碑和公开权限。"
        action={
          <Link href="/dashboard/projects/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
            <Plus size={16} />
            新建项目
          </Link>
        }
      />
      <form className="mb-5 flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
          <option value="all">全部状态</option>
          {projectStatuses.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select name="visibility" defaultValue={visibility} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
          <option value="all">全部权限</option>
          {visibilityOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:text-blue-700">筛选</button>
      </form>
      {projects.length === 0 ? (
        <Card className="text-center">
          <p className="text-base font-semibold text-slate-900">还没有研究项目</p>
          <p className="mt-2 text-sm text-slate-500">创建第一个项目后，Dashboard 和公开首页会开始读取真实数据。</p>
          <Link href="/dashboard/projects/new" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建项目</Link>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
