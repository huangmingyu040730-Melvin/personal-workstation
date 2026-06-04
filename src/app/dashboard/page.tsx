import { BookOpen, CalendarCheck, FileText, FolderKanban, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { Progress } from "@/components/progress";
import { StatCard } from "@/components/stat-card";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { profile, quickActions, todayItems } from "@/lib/mock-data";
import { getDashboardData } from "@/lib/queries/dashboard";

function activityTitle(metadata: Record<string, unknown>, fallback: string) {
  const title = metadata.title ?? metadata.name ?? metadata.slug;
  return typeof title === "string" ? title : fallback;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-6 shadow-soft">
        <p className="text-sm font-medium text-blue-700">个人研究与 AI 工作台</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">你好，{profile.name}</h1>
        <p className="mt-2 text-sm text-slate-600">Projects、Knowledge、Skills 与 Publications 已接入 Supabase 真实数据。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="今日待办" value="占位" helper="日历功能将在下一阶段接入" icon={CalendarCheck} />
        <StatCard label="今日日程" value="占位" helper="暂未接入真实 Calendar" icon={CalendarCheck} />
        <StatCard label="进行中项目" value={String(data.inProgressProjects.length)} helper={`项目总数 ${data.projects.length}`} icon={FolderKanban} />
        <StatCard label="已收录成果" value={String(data.publicationStats.total)} helper={`公开 ${data.publicationStats.publicCount} · 精选 ${data.publicationStats.featuredCount}`} icon={FileText} />
        <StatCard label="可用 Skill" value={String(data.availableSkillCount)} helper={`Skill 总数 ${data.skills.length}`} icon={Sparkles} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.9fr_0.75fr]">
        <Card>
          <CardHeader title="今日安排" description="占位数据：Calendar CRUD 将在下一阶段接入" />
          <div className="space-y-3">
            {todayItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                <span className="w-14 text-sm font-semibold text-blue-700">{item.time}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="最近项目进展" action={<Link href="/dashboard/projects" className="text-sm font-medium text-blue-700">查看全部</Link>} />
          <div className="space-y-5">
            {data.projects.length > 0 ? data.projects.slice(0, 4).map((project) => (
              <div key={project.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-900">{project.title}</span>
                  <span className="text-slate-500">{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
            )) : <p className="text-sm text-slate-500">暂无真实项目。</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="快速入口" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="rounded-2xl bg-blue-50 p-4 text-center text-sm font-medium text-blue-800 transition hover:bg-blue-100">
                <action.icon className="mx-auto mb-2" size={24} />
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-4">
        <Card>
          <CardHeader title="最新学术成果" action={<Link href="/dashboard/publications" className="text-sm font-medium text-blue-700">查看全部</Link>} />
          <div className="space-y-4">
            {data.publications.length > 0 ? data.publications.map((item) => (
              <Link key={item.id} href={`/dashboard/publications/${item.id}`} className="flex gap-3">
                <FileText className="mt-1 text-blue-700" size={18} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{getPublicationTypeLabel(item.publication_type)} · {formatRelative(item.updated_at)}</p>
                </div>
              </Link>
            )) : <p className="text-sm text-slate-500">暂无真实成果。</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="知识库最近笔记" />
          <div className="space-y-4">
            {data.notes.length > 0 ? data.notes.map((note) => (
              <Link key={note.id} href={`/dashboard/knowledge/${note.id}`} className="flex gap-3">
                <BookOpen className="mt-1 text-emerald-600" size={18} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{note.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatRelative(note.updated_at)}</p>
                </div>
              </Link>
            )) : <p className="text-sm text-slate-500">暂无真实笔记。</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Skill 库最近更新" />
          <div className="space-y-4">
            {data.skills.length > 0 ? data.skills.map((skill) => (
              <Link key={skill.id} href={`/dashboard/skills/${skill.id}`} className="block">
                <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                <p className="mt-1 text-xs text-slate-500">{skill.status} · {formatRelative(skill.updated_at)}</p>
              </Link>
            )) : <p className="text-sm text-slate-500">暂无真实 Skill。</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="最近动态" />
          <div className="space-y-3">
            {data.activityLogs.length > 0 ? data.activityLogs.map((activity) => (
              <p key={activity.id} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                {activity.action}：{activityTitle(activity.metadata, activity.entity_type ?? "内容")} · {formatRelative(activity.created_at)}
              </p>
            )) : <p className="text-sm text-slate-500">暂无操作日志。</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
