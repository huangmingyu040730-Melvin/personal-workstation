import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Layers3, Sparkles } from "lucide-react";
import { deleteResumeVersionAction } from "@/actions/resume";
import { AppShell } from "@/components/app-shell";
import { AdminDangerZone, AdminPageSurface } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { ResumeQualityPanel } from "@/components/resume-quality";
import { getResumeSectionLabel, getResumeTemplateLabel, getResumeVersionLanguageLabel } from "@/lib/content-options";
import type { ResumeSectionKey, ResumeVersionItemRecord } from "@/lib/content-types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems, getResumeVersionWithItems } from "@/lib/queries/resume";
import { getResumeItemDisplay } from "@/lib/resume-display";
import { analyzeResumeVersionQuality, getTargetKeywords } from "@/lib/resume-quality";

const sectionOrder: ResumeSectionKey[] = ["summary", "education", "experience", "projects", "research", "skills", "certifications", "awards", "other"];

export default async function ResumeVersionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [version, publicProfile, basicItems] = await Promise.all([
    getResumeVersionWithItems(id),
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);

  if (!version) {
    notFound();
  }

  const error = getFormError(query);
  const deleteAction = deleteResumeVersionAction.bind(null, version.id);
  const groupedItems = groupVersionItems(version.resume_version_items);
  const profile = publicProfile ?? getProfileFallback();
  const selectedBasicItem = version.resume_version_items.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
  const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  const quality = analyzeResumeVersionQuality({ version, versionItems: version.resume_version_items, profile, basicItem: selectedBasicItem ?? latestBasicItem });
  const targetKeywords = getTargetKeywords(version);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Resume Version"
          title={version.title}
          description="简历版本详情。这里保存的是素材组合、区块、排序和预览设置。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/resume/versions/${version.id}/preview`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Eye size={16} />
                预览
              </Link>
              <Link href={`/dashboard/resume/versions/${version.id}/jd-review`} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
                <Sparkles size={16} />
                AI JD 优化
              </Link>
              <Link href={`/dashboard/resume/versions/${version.id}/edit`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">编辑</Link>
              <Link href="/dashboard/resume/versions" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">返回版本列表</Link>
            </div>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
          <div className="space-y-5">
            <ResumeQualityPanel report={quality} />

            <Card>
              <CardHeader title="版本摘要" />
              <MarkdownPreview content={version.summary} emptyText="尚未填写版本摘要。" />
            </Card>

            <Card>
              <CardHeader title="已选素材" action={<Badge className="bg-blue-50 text-blue-700 ring-blue-100">{version.resume_version_items.length} 条</Badge>} />
              {version.resume_version_items.length > 0 ? (
                <div className="space-y-5">
                  {sectionOrder.map((sectionKey) => {
                    const items = groupedItems.get(sectionKey) ?? [];
                    if (items.length === 0) {
                      return null;
                    }

                    return (
                      <section key={sectionKey}>
                        <h3 className="mb-3 text-sm font-semibold text-slate-950">{getResumeSectionLabel(sectionKey)}</h3>
                        <div className="space-y-3">
                          {items.map((item) => {
                            const display = item.resume_items ? getResumeItemDisplay(item.resume_items, item.section_key) : null;

                            return (
                              <Link key={item.id} href={`/dashboard/resume/${item.resume_item_id}`} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-950">{display?.title ?? "已删除素材"}</p>
                                    {display?.subtitle ? <p className="mt-1 text-sm text-slate-500">{display.subtitle}</p> : null}
                                    {display?.meta ? <p className="mt-1 text-xs text-slate-400">{display.meta}</p> : null}
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-white text-slate-500 ring-slate-200">#{item.sort_order}</Badge>
                                    {item.is_visible ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">展示</Badge> : <Badge className="bg-slate-100 text-slate-500 ring-slate-100">隐藏</Badge>}
                                  </div>
                                </div>
                                {display?.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{display.description}</p> : null}
                                {item.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p> : null}
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">这个版本还没有选择素材。</p>
              )}
            </Card>

            <AdminDangerZone description="删除版本只会删除组合配置，不会删除原始简历素材。">
              <form action={deleteAction}>
                <DeleteButton label="删除版本" />
              </form>
            </AdminDangerZone>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="版本属性" action={<VisibilityBadge visibility={version.visibility} />} />
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getResumeVersionLanguageLabel(version.language)}</Badge>
                <Badge className="bg-slate-100 text-slate-600 ring-slate-100">{getResumeTemplateLabel(version.template_key)}</Badge>
                {version.is_active ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">启用</Badge> : <Badge className="bg-slate-100 text-slate-500 ring-slate-100">停用</Badge>}
                {version.is_featured ? <Badge className="bg-violet-50 text-violet-700 ring-violet-100">重点版本</Badge> : null}
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow label="目标岗位" value={version.target_role || "未设置"} />
                <InfoRow label="目标关键词" value={targetKeywords.length > 0 ? targetKeywords.join("、") : "未设置"} />
                <InfoRow label="素材数量" value={`${version.resume_version_items.length} 条`} />
                <InfoRow label="创建时间" value={formatDateTime(version.created_at)} />
                <InfoRow label="更新时间" value={`${formatDateTime(version.updated_at)} · ${formatRelative(version.updated_at)}`} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="内部备注" action={<Layers3 size={18} className="text-blue-700" />} />
              <MarkdownPreview content={version.notes} emptyText="暂无内部备注。" />
            </Card>
          </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function groupVersionItems(items: ResumeVersionItemRecord[]) {
  const grouped = new Map<ResumeSectionKey, ResumeVersionItemRecord[]>();
  for (const item of items) {
    const current = grouped.get(item.section_key) ?? [];
    current.push(item);
    grouped.set(item.section_key, current);
  }

  for (const [key, values] of Array.from(grouped.entries())) {
    grouped.set(key, [...values].sort((a, b) => a.sort_order - b.sort_order || (a.resume_items?.title ?? "").localeCompare(b.resume_items?.title ?? "")));
  }

  return grouped;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
