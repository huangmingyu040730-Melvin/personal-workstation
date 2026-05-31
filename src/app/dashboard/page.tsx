import { BookOpen, CalendarCheck, FileText, FolderKanban, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { Progress } from "@/components/progress";
import { StatCard } from "@/components/stat-card";
import { activityFeed, knowledgeNotes, profile, projects, publications, quickActions, skills, todayItems } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-6 shadow-soft">
        <p className="text-sm font-medium text-blue-700">个人研究与 AI 工作台</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">你好，{profile.name}</h1>
        <p className="mt-2 text-sm text-slate-600">持续学习、深度思考，创建可复用的研究资产。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="今日待办" value="20" helper="4 项重点事项" icon={CalendarCheck} />
        <StatCard label="今日日程" value="3" helper="研究、会议、学习" icon={CalendarCheck} />
        <StatCard label="进行中项目" value="2" helper="平均进度 60%" icon={FolderKanban} />
        <StatCard label="已发布成果" value="3" helper="报告与论文草稿" icon={FileText} />
        <StatCard label="可用 Skill" value="1" helper="2 个建设中" icon={Sparkles} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.9fr_0.75fr]">
        <Card>
          <CardHeader title="今日安排" description="按时间线整理需要推进的研究与学习任务" />
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
          <CardHeader title="最近项目进展" action={<Link href="/projects" className="text-sm font-medium text-blue-700">查看全部</Link>} />
          <div className="space-y-5">
            {projects.map((project) => (
              <div key={project.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-900">{project.name}</span>
                  <span className="text-slate-500">{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
            ))}
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
          <CardHeader title="最新学术成果" />
          <div className="space-y-4">
            {publications.map((item) => (
              <div key={item.id} className="flex gap-3">
                <FileText className="mt-1 text-blue-700" size={18} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="知识库最近笔记" />
          <div className="space-y-4">
            {knowledgeNotes.map((note) => (
              <div key={note.id} className="flex gap-3">
                <BookOpen className="mt-1 text-emerald-600" size={18} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{note.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{note.updatedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Skill 库最近更新" />
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.id}>
                <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                <p className="mt-1 text-xs text-slate-500">{skill.status} · {skill.updatedAt}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="最近动态" />
          <div className="space-y-3">
            {activityFeed.map((activity) => (
              <p key={activity} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{activity}</p>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
