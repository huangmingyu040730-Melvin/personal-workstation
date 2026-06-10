import Link from "next/link";
import { Eye, FileUser, Layers3, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { CareerTabs } from "@/components/career-tabs";
import { PageHeader } from "@/components/page-header";
import { ResumeQualityBadge } from "@/components/resume-quality";
import { getResumeTemplateLabel, getResumeVersionLanguageLabel } from "@/lib/content-options";
import type { ResumeVersionWithItems } from "@/lib/content-types";
import { formatRelative } from "@/lib/format";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems, getResumeVersionItemCounts, getResumeVersionItemsForQuality, getResumeVersionStats, getResumeVersions } from "@/lib/queries/resume";
import { analyzeResumeVersionQuality } from "@/lib/resume-quality";

export default async function ResumeVersionsPage() {
  const [versions, stats, itemCounts, qualityItems, publicProfile, basicItems] = await Promise.all([
    getResumeVersions(),
    getResumeVersionStats(),
    getResumeVersionItemCounts(),
    getResumeVersionItemsForQuality(),
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);
  const profile = publicProfile ?? getProfileFallback();
  const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Resume Versions"
          title="简历版本"
          description="将简历素材按岗位、语言和场景组合成不同版本，并在后台预览。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/resume" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                素材库
              </Link>
              <Link href="/dashboard/resume/versions/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
                <Plus size={16} />
                新建版本
              </Link>
            </div>
          }
        />

        <CareerTabs active="versions" />

        <div className="grid gap-4 md:grid-cols-3">
          <ResumeVersionMetric label="版本总数" value={stats.total} icon={<FileUser size={20} />} />
          <ResumeVersionMetric label="启用版本" value={stats.active} icon={<Eye size={20} />} />
          <ResumeVersionMetric label="重点版本" value={stats.featured} icon={<Star size={20} />} />
        </div>

        <AdminSection title="版本列表" description="每个版本保存一组已选择素材、排序和展示配置。">
          {versions.length === 0 ? (
            <AdminEmptyState
              title="还没有简历版本"
              description="先选择一批履历素材，组合成投研、量化、学术或通用申请版本。"
              action={<Link href="/dashboard/resume/versions/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建版本</Link>}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {versions.map((version) => (
                <AdminContentCard key={version.id} href={`/dashboard/resume/versions/${version.id}`} className="hover:border-blue-200">
                  {(() => {
                    const versionItems: ResumeVersionWithItems["resume_version_items"] = qualityItems.get(version.id) ?? [];
                    const selectedBasicItem = versionItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
                    const quality = analyzeResumeVersionQuality({ version, versionItems, profile, basicItem: selectedBasicItem ?? latestBasicItem });

                    return (
                      <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getResumeVersionLanguageLabel(version.language)}</Badge>
                        <Badge className="bg-slate-100 text-slate-600 ring-slate-100">{getResumeTemplateLabel(version.template_key)}</Badge>
                        {version.is_active ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">启用</Badge> : <Badge className="bg-slate-100 text-slate-500 ring-slate-100">停用</Badge>}
                        {version.is_featured ? <Badge className="bg-violet-50 text-violet-700 ring-violet-100">重点版本</Badge> : null}
                        <VisibilityBadge visibility={version.visibility} />
                        <ResumeQualityBadge report={quality} />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-950">{version.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{version.target_role || version.summary || "尚未填写目标岗位或摘要。"}</p>
                    </div>
                    <span className="shrink-0 rounded-2xl bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{itemCounts.get(version.id) ?? 0} 条素材</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${quality.score}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {quality.warnings[0] ?? quality.suggestions[0] ?? "核心信息较完整，可进入预览检查。"}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>更新于 {formatRelative(version.updated_at)}</span>
                    <span className="inline-flex items-center gap-1 text-blue-700">
                      <Layers3 size={14} />
                      查看组合
                    </span>
                  </div>
                      </>
                    );
                  })()}
                </AdminContentCard>
              ))}
            </div>
          )}
        </AdminSection>
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeVersionMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</div>
      <p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
