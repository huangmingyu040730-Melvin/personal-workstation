import Link from "next/link";
import { Award, BriefcaseBusiness, GraduationCap, Plus, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { getResumeItemTypeLabel, resumeItemTypes } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getResumeItems, getResumeStats } from "@/lib/queries/resume";

export default async function ResumePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const itemType = params.item_type ?? "all";
  const visibility = params.visibility ?? "all";
  const q = params.q ?? "";
  const [items, stats] = await Promise.all([getResumeItems({ itemType, visibility, q }), getResumeStats()]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Resume Library"
          title="简历素材库"
          description="维护教育、实习、项目、研究、技能、证书和奖项等结构化履历素材，为后续生成不同版本简历做准备。"
          action={
            <Link href="/dashboard/resume/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
              <Plus size={16} />
              新建素材
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ResumeMetric label="素材总数" value={stats.total} icon={<BriefcaseBusiness size={20} />} />
          <ResumeMetric label="教育经历" value={stats.education} icon={<GraduationCap size={20} />} />
          <ResumeMetric label="实习 / 工作" value={stats.experience} icon={<Sparkles size={20} />} />
          <ResumeMetric label="技能 / 证书 / 奖项" value={stats.skillCertificationAward} icon={<Award size={20} />} />
        </div>

        <AdminSection title="筛选素材" description="按素材类型、权限或关键词快速定位可复用的履历条目。">
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_160px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                name="q"
                defaultValue={q}
                placeholder="搜索标题、机构、bullet、技能或标签"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <select name="item_type" defaultValue={itemType} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              <option value="all">全部类型</option>
              {resumeItemTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select name="visibility" defaultValue={visibility} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              <option value="all">全部权限</option>
              <option value="private">私密</option>
              <option value="public">公开</option>
            </select>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
          </form>
        </AdminSection>

        {items.length === 0 ? (
          <AdminEmptyState
            title="还没有简历素材"
            description="先创建教育、实习、项目、研究或 Skill 相关素材，后续可用于组合生成不同版本简历。"
            action={<Link href="/dashboard/resume/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建素材</Link>}
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {items.map((item) => (
              <AdminContentCard key={item.id} href={`/dashboard/resume/${item.id}`} className="hover:border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getResumeItemTypeLabel(item.item_type)}</Badge>
                      {item.is_featured ? <Badge className="bg-violet-50 text-violet-700 ring-violet-100">重点素材</Badge> : null}
                      <VisibilityBadge visibility={item.visibility} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {[item.organization, item.role_title].filter(Boolean).join(" · ") || item.summary || "尚未填写机构或概述。"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-2xl bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">#{item.sort_order}</span>
                </div>
                {item.bullets.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    {item.bullets.slice(0, 2).map((bullet) => (
                      <li key={bullet} className="line-clamp-2">· {bullet}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">更新于 {formatRelative(item.updated_at)}</div>
              </AdminContentCard>
            ))}
          </div>
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</div>
      <p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
