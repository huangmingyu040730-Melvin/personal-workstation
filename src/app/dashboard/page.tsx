import { Activity, AlertTriangle, Archive, BookOpen, BriefcaseBusiness, CalendarCheck, CheckCircle2, FileText, FolderKanban, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Card, CardHeader } from "@/components/card";
import { Progress } from "@/components/progress";
import { StatCard } from "@/components/stat-card";
import { getCalendarEventTypeLabel, getPublicationTypeLabel, getResumeItemTypeLabel, getResumeTemplateLabel } from "@/lib/content-options";
import { formatDateInputValue, formatDateTime, formatRelative } from "@/lib/format";
import { profile, quickActions } from "@/lib/mock-data";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getResumeItemDisplay } from "@/lib/resume-display";
import type { WeeklyReviewAttentionItem } from "@/lib/workstation/weekly-review";

function activityTitle(metadata: Record<string, unknown>, fallback: string) {
  const title = metadata.title ?? metadata.name ?? metadata.slug;
  return typeof title === "string" ? title : fallback;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <AdminPageSurface>
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">个人研究与 AI 工作台</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 md:text-4xl">你好，{profile.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">维护公开研究主页、研究资产、私密文件中心、知识库与求职闭环。Projects、Knowledge、Skills、Publications、Documents、Calendar 与 Career 已作为当前稳定工作台主线。</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Link href="/dashboard/projects/new" className="rounded-2xl bg-navy-900 px-4 py-3 text-center font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-800">新建项目</Link>
            <Link href="/dashboard/publications/new" className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-center font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50">新建成果</Link>
            <Link href="/dashboard/documents/upload" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">上传文件</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard label="站内日程" value={String(data.upcomingCalendarEvents.length)} helper={`今日 ${data.upcomingCalendarEvents.filter((event) => isToday(event.starts_at)).length} · 近期事项`} icon={CalendarCheck} />
        <StatCard label="研究项目" value={String(data.projects.length)} helper={`进行中 ${data.inProgressProjects.length}`} icon={FolderKanban} />
        <StatCard label="知识文章" value={String(data.publicCounts.knowledge)} helper="公开可浏览知识内容" icon={BookOpen} />
        <StatCard label="Skill 库" value={String(data.availableSkillCount)} helper={`公开 ${data.publicCounts.skills} · 可用 Skill`} icon={Sparkles} />
        <StatCard label="学术成果" value={String(data.publicationStats.total)} helper={`公开 ${data.publicationStats.publicCount} · 精选 ${data.publicationStats.featuredCount}`} icon={FileText} />
        <StatCard label="私密文件" value={String(data.documentCount)} helper="Documents 私密资产" icon={Archive} />
        <StatCard label="求职闭环" value={String(data.resumeVersionStats.total)} helper={`素材 ${data.resumeStats.total} · 启用 ${data.resumeVersionStats.active}`} icon={BriefcaseBusiness} />
      </div>

      <AdminSection
        title="资产健康与本周复盘"
        description="只读取资产元数据，汇总最近 7 天的推进情况，并把需要处理的项目、文档包、Skill 与求职记录集中到一起。"
        action={
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${weeklyReviewStatusClass(data.weeklyReview.health.status)}`}>
            {data.weeklyReview.health.status === "healthy" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {weeklyReviewStatusLabel(data.weeklyReview.health.status)}
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <HealthMetric
            label="活跃项目知识沉淀"
            value={`${data.weeklyReview.health.activeProjectsWithKnowledge}/${data.weeklyReview.health.activeProjectsTotal}`}
            helper="已有至少一条关联知识笔记"
            href="/dashboard/projects"
          />
          <HealthMetric
            label="非空文档包"
            value={`${data.weeklyReview.health.populatedCollections}/${data.weeklyReview.health.collectionsTotal}`}
            helper="至少包含一个文件"
            href="/dashboard/documents"
          />
          <HealthMetric
            label="可用 Skill"
            value={`${data.weeklyReview.health.availableSkills}/${data.weeklyReview.health.skillsTotal}`}
            helper="其余处于构思、开发或测试"
            href="/dashboard/skills"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Activity size={17} />
              <p className="text-sm font-semibold">最近 7 天</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5 xl:grid-cols-2">
              {[
                { label: "项目更新", value: data.weeklyReview.thisWeek.projectsUpdated },
                { label: "知识更新", value: data.weeklyReview.thisWeek.knowledgeUpdated },
                { label: "Skill 更新", value: data.weeklyReview.thisWeek.skillsUpdated },
                { label: "文档包更新", value: data.weeklyReview.thisWeek.collectionsUpdated },
                { label: "求职更新", value: data.weeklyReview.thisWeek.applicationsUpdated }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="text-xl font-semibold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">待处理事项</p>
              <span className="text-xs font-medium text-slate-400">共 {data.weeklyReview.attention.length} 项</span>
            </div>
            {data.weeklyReview.attention.length > 0 ? (
              <div className="space-y-2">
                {data.weeklyReview.attention.slice(0, 6).map((item) => (
                  <Link key={`${item.kind}-${item.entityId}`} href={item.href} className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${weeklyReviewSeverityClass(item.severity)}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-950 group-hover:text-blue-800">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </span>
                  </Link>
                ))}
                {data.weeklyReview.attention.length > 6 ? (
                  <p className="text-xs text-slate-500">还有 {data.weeklyReview.attention.length - 6} 项，可通过 <code>workstation-cli review --period week</code> 查看完整列表。</p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                当前没有达到提醒阈值的事项，可以继续按现有节奏推进。
              </div>
            )}
          </div>
        </div>
      </AdminSection>

      <AdminSection title="公开内容质量提示" description="公开内容越完整，公开研究工作站越适合分享给外部访客。">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          {[
            { label: "公开项目", value: data.publicCounts.projects, href: "/dashboard/projects" },
            { label: "公开成果", value: data.publicCounts.publications, href: "/dashboard/publications" },
            { label: "公开 Skill", value: data.publicCounts.skills, href: "/dashboard/skills" },
            { label: "公开文章", value: data.publicCounts.knowledge, href: "/dashboard/knowledge" }
          ].map((item) => (
            <Link key={item.label} href={item.href} className="admin-card-motion rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50">
              <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-1 text-slate-500">{item.label}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-600">建议优先补齐标题、简介、标签、正文摘要，并将适合展示的内容设为 public；精选内容会优先出现在公开首页。</p>
      </AdminSection>

      <AdminSection
        title="简历素材与版本"
        description="维护结构化素材，并组合成面向不同岗位或场景的简历版本。"
        action={<Link href="/dashboard/resume/versions" className="text-sm font-medium text-blue-700">版本管理</Link>}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">最近素材</p>
              <Link href="/dashboard/resume" className="text-xs font-semibold text-blue-700">素材库</Link>
            </div>
            {data.recentResumeItems.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                {data.recentResumeItems.map((item) => {
                  const display = getResumeItemDisplay(item);

                  return (
                    <Link key={item.id} href={`/dashboard/resume/${item.id}`} className="admin-card-motion rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50">
                      <p className="text-xs font-semibold text-blue-700">{getResumeItemTypeLabel(item.item_type)}</p>
                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-950">{display.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{display.subtitle || display.meta || display.description || "待补充摘要"}</p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                暂无简历素材。
                <Link href="/dashboard/resume/new" className="ml-2 font-semibold text-blue-700">新建素材</Link>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">最近版本</p>
              <Link href="/dashboard/resume/versions/new" className="text-xs font-semibold text-blue-700">新建版本</Link>
            </div>
            {data.recentResumeVersions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                {data.recentResumeVersions.map((version) => (
                  <Link key={version.id} href={`/dashboard/resume/versions/${version.id}`} className="admin-card-motion rounded-2xl border border-slate-100 bg-blue-50/60 p-4 hover:border-blue-200 hover:bg-white">
                    <p className="text-xs font-semibold text-blue-700">{getResumeTemplateLabel(version.template_key)}</p>
                    <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-950">{version.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{version.target_role || (version.is_active ? "启用版本" : "停用版本")}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                暂无简历版本。
                <Link href="/dashboard/resume/versions/new" className="ml-2 font-semibold text-blue-700">新建版本</Link>
              </div>
            )}
          </div>
        </div>
      </AdminSection>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.9fr_0.75fr]">
        <Card>
          <CardHeader
            title="近期日程"
            description="来自 Supabase calendar_events 表"
            action={<Link href="/dashboard/calendar" className="text-sm font-medium text-blue-700">查看全部</Link>}
          />
          <div className="space-y-3">
            {data.upcomingCalendarEvents.length > 0 ? data.upcomingCalendarEvents.map((item) => (
              <Link key={item.id} href={`/dashboard/calendar/${item.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50">
                <span className="w-28 text-sm font-semibold text-blue-700">{formatDateTime(item.starts_at)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{getCalendarEventTypeLabel(item.event_type)} · {item.visibility === "public" ? "公开" : "私密"}</p>
                </div>
              </Link>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                暂无即将到来的日程。
                <Link href="/dashboard/calendar/new" className="ml-2 font-semibold text-blue-700">新建日程</Link>
              </div>
            )}
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
              <Link key={action.label} href={action.href} className="admin-card-motion rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center text-sm font-medium text-blue-800 hover:bg-white">
                <action.icon className="mx-auto mb-2" size={24} />
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <Card>
          <CardHeader title="最新学术成果" action={<Link href="/dashboard/publications" className="text-sm font-medium text-blue-700">查看全部</Link>} />
          <div className="space-y-4">
            {data.publications.length > 0 ? data.publications.map((item) => (
              <Link key={item.id} href={`/dashboard/publications/${item.id}`} className="rounded-2xl p-2 -m-2 flex gap-3 transition hover:bg-blue-50">
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
              <Link key={note.id} href={`/dashboard/knowledge/${note.id}`} className="rounded-2xl p-2 -m-2 flex gap-3 transition hover:bg-blue-50">
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
              <Link key={skill.id} href={`/dashboard/skills/${skill.id}`} className="block rounded-2xl p-2 -m-2 transition hover:bg-blue-50">
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
              <p key={activity.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                {activity.action}：{activityTitle(activity.metadata, activity.entity_type ?? "内容")} · {formatRelative(activity.created_at)}
              </p>
            )) : <p className="text-sm text-slate-500">暂无操作日志。</p>}
          </div>
        </Card>
      </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function isToday(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return formatDateInputValue(value) === formatDateInputValue();
}

function HealthMetric({ label, value, helper, href }: { label: string; value: string; helper: string; href: string }) {
  return (
    <Link href={href} className="admin-card-motion rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </Link>
  );
}

function weeklyReviewStatusLabel(status: "healthy" | "watch" | "action_required") {
  if (status === "healthy") return "状态健康";
  if (status === "action_required") return "需要处理";
  return "建议关注";
}

function weeklyReviewStatusClass(status: "healthy" | "watch" | "action_required") {
  if (status === "healthy") return "bg-emerald-50 text-emerald-700";
  if (status === "action_required") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

function weeklyReviewSeverityClass(severity: WeeklyReviewAttentionItem["severity"]) {
  if (severity === "high") return "bg-rose-500";
  if (severity === "medium") return "bg-amber-500";
  return "bg-blue-500";
}
