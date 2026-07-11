import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileSearch, FileUser, Layers3, ListChecks, Sparkles, Trophy, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { CareerTabs } from "@/components/career-tabs";
import { PageHeader } from "@/components/page-header";
import { formatRelative } from "@/lib/format";
import { getResumeItems, getResumeVersionStats, getRecentResumeVersions } from "@/lib/queries/resume";
import { getResumeApplicationStats, getResumeJdReviews } from "@/lib/queries/resume-jd-reviews";
import { getResumeJdReviewStatusLabel, getResumeJdReviewStatusTone } from "@/lib/resume-jd-review-options";

const workflowSteps = [
  {
    step: 1,
    title: "简历素材",
    description: "沉淀可复用的教育、实习、项目和技能事实。",
    href: "/dashboard/resume",
    action: "管理素材",
    icon: FileUser,
    metric: "items" as const
  },
  {
    step: 2,
    title: "简历版本",
    description: "按目标岗位组合素材，检查质量并导出 Word。",
    href: "/dashboard/resume/versions",
    action: "组合版本",
    icon: Layers3,
    metric: "versions" as const
  },
  {
    step: 3,
    title: "JD 分析",
    description: "选择一个版本，对照岗位要求识别匹配项和缺口。",
    href: "/dashboard/resume/jd-reviews",
    action: "查看分析",
    icon: FileSearch,
    metric: "reviews" as const
  },
  {
    step: 4,
    title: "投递跟进",
    description: "维护投递状态、下一步动作和面试进展。",
    href: "/dashboard/resume/applications",
    action: "跟进投递",
    icon: BriefcaseBusiness,
    metric: "applications" as const
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
  const workflowCounts = {
    items: resumeItems.length,
    versions: versionStats.total,
    reviews: jdReviews.length,
    applications: applicationStats.active
  };
  const recommendation = getCareerRecommendation({
    itemCount: resumeItems.length,
    versionCount: versionStats.total,
    reviewCount: jdReviews.length,
    activeApplicationCount: applicationStats.active,
    interviewCount: applicationStats.interview
  });

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          compact
          eyebrow="Career Center"
          title="求职中心"
          description="从真实履历素材出发，生成岗位版本、分析 JD，并持续跟进投递进度。"
          action={
            <Link href="/dashboard/resume/applications" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <BriefcaseBusiness size={16} />
              打开投递看板
            </Link>
          }
        />

        <CareerTabs active="center" />

        <section aria-label="求职中心概览" className="grid grid-cols-2 gap-px overflow-hidden border-y border-slate-200 bg-slate-200 md:grid-cols-3 xl:grid-cols-6">
          <CareerMetric label="简历素材" value={resumeItems.length} icon={<FileUser size={18} />} />
          <CareerMetric label="简历版本" value={versionStats.total} icon={<Layers3 size={18} />} />
          <CareerMetric label="JD 分析" value={jdReviews.length} icon={<FileSearch size={18} />} />
          <CareerMetric label="进行中" value={applicationStats.active} icon={<ListChecks size={18} />} />
          <CareerMetric label="面试中" value={applicationStats.interview} icon={<UserRoundCheck size={18} />} />
          <CareerMetric label="Offer" value={applicationStats.offer} icon={<Trophy size={18} />} />
        </section>

        <section className="flex flex-col gap-4 border border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">下一步建议</p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">{recommendation.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{recommendation.description}</p>
            </div>
          </div>
          <Link href={recommendation.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800">
            {recommendation.action}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>

        <AdminSection title="求职工作流" description="按顺序完成四步；已有内容可随时进入对应步骤更新。">
          <div className="grid overflow-hidden border border-slate-200 bg-slate-50/60 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step) => (
              <Link key={step.href} href={step.href} className="group border-b border-slate-200 p-5 transition hover:bg-white md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-slate-200">
                    <step.icon size={19} aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">STEP 0{step.step}</span>
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                  <span className="text-2xl font-semibold text-slate-950">{workflowCounts[step.metric]}</span>
                </div>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{step.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  {step.action}
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="最近动态" description="快速查看最近更新的简历版本和最近保存的 JD 分析记录。">
          <div className="grid divide-y divide-slate-200 border-y border-slate-200 xl:grid-cols-2 xl:divide-x xl:divide-y-0">
            <section className="py-4 xl:pr-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={17} className="text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-950">最近简历版本</h2>
              </div>
              <div className="space-y-3">
                {versions.length > 0 ? (
                  versions.map((version) => (
                    <Link key={version.id} href={`/dashboard/resume/versions/${version.id}`} className="block border-b border-slate-100 py-3 transition last:border-0 hover:bg-blue-50/60">
                      <p className="text-sm font-semibold text-slate-950">{version.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{version.target_role || "未设置目标岗位"} · 更新于 {formatRelative(version.updated_at)}</p>
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-sm text-slate-500">暂无简历版本。</p>
                )}
              </div>
            </section>

            <section className="py-4 xl:pl-5">
              <div className="mb-4 flex items-center gap-2">
                <FileSearch size={17} className="text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-950">最近 JD 分析记录</h2>
              </div>
              <div className="space-y-3">
                {jdReviews.slice(0, 3).length > 0 ? (
                  jdReviews.slice(0, 3).map((review) => (
                    <Link key={review.id} href={`/dashboard/resume/jd-reviews/${review.id}`} className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 transition last:border-0 hover:bg-blue-50/60">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{review.job_title || "未命名岗位"}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{review.company_name || "未填写公司"} · {formatRelative(review.updated_at)}</p>
                      </div>
                      <Badge className={getResumeJdReviewStatusTone(review.application_status)}>{getResumeJdReviewStatusLabel(review.application_status)}</Badge>
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-sm text-slate-500">暂无 JD 分析记录。</p>
                )}
              </div>
            </section>
          </div>
        </AdminSection>
      </AdminPageSurface>
    </AppShell>
  );
}

function CareerMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-slate-950">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function getCareerRecommendation({
  itemCount,
  versionCount,
  reviewCount,
  activeApplicationCount,
  interviewCount
}: {
  itemCount: number;
  versionCount: number;
  reviewCount: number;
  activeApplicationCount: number;
  interviewCount: number;
}) {
  if (itemCount === 0) {
    return { title: "先建立一组可复用的简历素材", description: "从教育、实习和项目经历开始，后续版本都可以直接复用。", action: "新建素材", href: "/dashboard/resume/new" };
  }

  if (versionCount === 0) {
    return { title: "把现有素材组合成第一个岗位版本", description: "选择目标岗位、展示字段和素材顺序，再进入质量检查。", action: "新建版本", href: "/dashboard/resume/versions/new" };
  }

  if (reviewCount === 0) {
    return { title: "选择一个简历版本开始 JD 分析", description: "分析会识别匹配关键词、事实缺口和下一步行动，不会自动改写经历。", action: "选择版本", href: "/dashboard/resume/versions" };
  }

  if (activeApplicationCount === 0) {
    return { title: "当前没有进行中的投递，开始分析新岗位", description: "已有历史记录仍保留在归档中；选择一个简历版本进入下一次 JD 分析。", action: "选择版本", href: "/dashboard/resume/versions" };
  }

  if (interviewCount > 0) {
    return { title: `跟进 ${interviewCount} 条面试中记录`, description: "集中更新面试进度、备注与下一步动作，避免遗漏。", action: "查看面试", href: "/dashboard/resume/applications?status=interview" };
  }

  return { title: "检查当前投递进度并确定下一步", description: "看板默认聚焦进行中的记录，历史记录可单独查看归档。", action: "打开看板", href: "/dashboard/resume/applications" };
}
