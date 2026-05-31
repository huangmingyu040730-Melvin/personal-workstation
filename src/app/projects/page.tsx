import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { projects } from "@/lib/mock-data";

export default function ProjectsPage() {
  const featured = projects[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Research Projects"
        title="研究项目"
        description="集中管理研究主题、进度、里程碑和相关资料，为后续接入 Supabase 保留结构化字段。"
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <Card>
          <CardHeader title="项目详情样式" description="当前展示首个重点项目的详情区块。" />
          <h2 className="text-xl font-semibold text-slate-950">{featured.name}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{featured.summary}</p>
          <div className="mt-6 space-y-3">
            {featured.milestones.map((milestone, index) => (
              <div key={milestone} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{index + 1}</span>
                <span className="text-sm text-slate-700">{milestone}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">下一步</p>
            <p className="mt-2 text-sm leading-6 text-blue-800">补齐数据来源、指标口径与报告模板，第二阶段接入真实项目资料与版本记录。</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
