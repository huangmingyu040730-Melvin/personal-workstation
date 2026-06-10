import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FileSearch, FileUser, Layers3, ListChecks, Sparkles, Trophy, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { CareerTabs } from "@/components/career-tabs";
import { PageHeader } from "@/components/page-header";
import { formatRelative } from "@/lib/format";
import { getResumeItems, getResumeVersionStats, getRecentResumeVersions } from "@/lib/queries/resume";
import { getResumeApplicationStats, getResumeJdReviews } from "@/lib/queries/resume-jd-reviews";
import { getResumeJdReviewStatusLabel, getResumeJdReviewStatusTone } from "@/lib/resume-jd-review-options";

const moduleCards = [
  {
    title: "简历素材",
    description: "维护教育、实习、项目、研究、技能、证书和奖项等结构化履历素材。",
    href: "/dashboard/resume",
    icon: FileUser
  },
  {
    title: "简历版本",
    description: "组合不同岗位方向的简历版本，控制展示字段，并导出 Word。",
    href: "/dashboard/resume/versions",
    icon: Layers3
  },
  {
    title: "投递看板",
    description: "按投递状态管理公司、岗位、进度和后续跟进。",
    href: "/dashboard/resume/applications",
    icon: BriefcaseBusiness
  },
  {
    title: "JD 分析记录",
    description: "保存 AI JD 分析结果、关键词缺口、风险和下一步行动。",
    href: "/dashboard/resume/jd-reviews",
    icon: FileSearch
  }
];

export default async function CareerCenterPage() {
  const [resumeItems, versionStats, versions, jdReviews] = await Promise.all([
    getResumeItems({ visibility: "all" }),
    getResumeVersionStats(),
    getRecentResumeVersions(3),
    getResumeJdReviews()
  ]);
  const applicationStats = getResumeApplicationStats(jdReviews);
  const activeApplications = jdReviews.filter((review) => review.application_status !== "archived").length;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Career Center"
          title="求职中心"
          description="统一管理简历素材、简历版本、JD 分析记录与投递进度。"
          action={
            <Link href="/dashboard/resume/applications" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <BriefcaseBusiness size={16} />
              打开投递看板
            </Link>
          }
        />

        <CareerTabs active="center" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <CareerMetric label="简历素材" value={resumeItems.length} icon={<FileUser size={20} />} />
          <CareerMetric label="简历版本" value={versionStats.total} icon={<Layers3 size={20} />} />
          <CareerMetric label="JD 分析记录" value={jdReviews.length} icon={<FileSearch size={20} />} />
          <CareerMetric label="当前投递记录" value={activeApplications} icon={<ListChecks size={20} />} />
          <CareerMetric label="面试中" value={applicationStats.interview} icon={<UserRoundCheck size={20} />} />
          <CareerMetric label="Offer" value={applicationStats.offer} icon={<Trophy size={20} />} />
        </div>

        <AdminSection title="子模块入口" description="求职相关能力保留原路径，通过求职中心统一进入。">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {moduleCards.map((module) => (
              <Link key={module.href} href={module.href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <module.icon size={22} />
                </div>
                <h2 className="mt-5 text-base font-semibold text-slate-950">{module.title}</h2>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">{module.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  进入
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="最近动态" description="快速查看最近更新的简历版本和最近保存的 JD 分析记录。">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={17} className="text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-950">最近简历版本</h2>
              </div>
              <div className="space-y-3">
                {versions.length > 0 ? (
                  versions.map((version) => (
                    <Link key={version.id} href={`/dashboard/resume/versions/${version.id}`} className="block rounded-2xl bg-white p-3 transition hover:bg-blue-50">
                      <p className="text-sm font-semibold text-slate-950">{version.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{version.target_role || "未设置目标岗位"} · 更新于 {formatRelative(version.updated_at)}</p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">暂无简历版本。</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <FileSearch size={17} className="text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-950">最近 JD 分析记录</h2>
              </div>
              <div className="space-y-3">
                {jdReviews.slice(0, 3).length > 0 ? (
                  jdReviews.slice(0, 3).map((review) => (
                    <Link key={review.id} href={`/dashboard/resume/jd-reviews/${review.id}`} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-3 transition hover:bg-blue-50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{review.job_title || "未命名岗位"}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{review.company_name || "未填写公司"} · {formatRelative(review.updated_at)}</p>
                      </div>
                      <Badge className={getResumeJdReviewStatusTone(review.application_status)}>{getResumeJdReviewStatusLabel(review.application_status)}</Badge>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">暂无 JD 分析记录。</p>
                )}
              </div>
            </div>
          </div>
        </AdminSection>
      </AdminPageSurface>
    </AppShell>
  );
}

function CareerMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</div>
      <p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
