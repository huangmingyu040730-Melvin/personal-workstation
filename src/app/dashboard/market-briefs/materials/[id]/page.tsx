import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { generateMarketBriefForDateAction } from "@/actions/market-briefs";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { SubmitButton } from "@/components/forms/submit-button";
import type { MarketBriefMaterialPackageSource } from "@/lib/content-types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getMarketBriefMaterialPackageStatusLabel,
  getMarketBriefMaterialPackageStatusTone,
  isUsableMarketBriefMaterialPackage
} from "@/lib/market-brief-material-packages";
import { getMarketBriefMaterialPackageById } from "@/lib/queries/market-brief-material-packages";
import { PageHeader } from "@/components/page-header";

export default async function MarketBriefMaterialPackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const materialPackage = await getMarketBriefMaterialPackageById(id);

  if (!materialPackage) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Material Package"
          title={`${formatDate(materialPackage.package_date)} ${materialPackage.market}素材包`}
          description="素材包保存公开来源、检索 query、采集提示和结构化快照，当前不自动生成正式市场简报。"
          action={
            <Link href="/dashboard/market-briefs/materials" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回素材包
            </Link>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader title="来源列表" description="来源只作为后台研究材料，不进入公开页面。" />
              {materialPackage.sources.length > 0 ? (
                <div className="space-y-3">
                  {materialPackage.sources.map((source) => (
                    <SourceCard key={`${source.id}-${source.url}`} source={source} />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">暂无可用来源。</p>
              )}
            </Card>

            <Card>
              <CardHeader title="检索 Queries" />
              {materialPackage.queries.length > 0 ? (
                <ol className="space-y-2 text-sm leading-6 text-slate-700">
                  {materialPackage.queries.map((query, index) => (
                    <li key={`${query}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2">
                      {query}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm leading-6 text-slate-500">暂无 query。</p>
              )}
            </Card>

            <JsonCard title="Source Snapshot" value={materialPackage.source_snapshot} />
            <JsonCard title="Extracted Facts" value={materialPackage.extracted_facts} />
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="素材包信息" />
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className={getMarketBriefMaterialPackageStatusTone(materialPackage.status)}>
                  {getMarketBriefMaterialPackageStatusLabel(materialPackage.status)}
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{materialPackage.market}</Badge>
                <Badge className="bg-slate-50 text-slate-600 ring-slate-200">{materialPackage.sources.length} 条来源</Badge>
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow label="日期" value={formatDate(materialPackage.package_date)} />
                <InfoRow label="Provider" value={materialPackage.provider_label ?? materialPackage.provider ?? "未配置"} />
                <InfoRow label="质量分" value={materialPackage.quality_score === null ? "暂无" : materialPackage.quality_score.toFixed(2)} />
                <InfoRow label="采集时间" value={materialPackage.collected_at ? formatDateTime(materialPackage.collected_at) : "未采集"} />
                <InfoRow label="复核时间" value={materialPackage.reviewed_at ? formatDateTime(materialPackage.reviewed_at) : "未复核"} />
                <InfoRow label="更新时间" value={formatDateTime(materialPackage.updated_at)} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="生成简报" action={<Sparkles size={18} className="text-blue-700" />} />
              {isUsableMarketBriefMaterialPackage(materialPackage) ? (
                <form action={generateMarketBriefForDateAction} className="space-y-3">
                  <input type="hidden" name="brief_date" value={materialPackage.package_date} />
                  <input type="hidden" name="market" value={materialPackage.market} />
                  <input type="hidden" name="material_package_id" value={materialPackage.id} />
                  <p className="text-sm leading-6 text-slate-600">使用此素材包创建生成任务。生成阶段只读取素材包来源，不再实时搜索。</p>
                  <SubmitButton pendingLabel="创建中...">基于此素材包生成简报</SubmitButton>
                </form>
              ) : (
                <p className="text-sm leading-6 text-slate-500">当前素材包状态不可用于生成。请重新采集或复核后再生成简报。</p>
              )}
            </Card>

            <TextListCard title="Warnings" values={materialPackage.warnings} emptyText="暂无 warning。" tone="rose" />
            <TextListCard title="Source Notes" values={materialPackage.source_notes} emptyText="暂无 source note。" tone="blue" />

            <Card>
              <CardHeader title="错误信息" />
              <p className={materialPackage.error_message ? "text-sm leading-6 text-rose-700" : "text-sm leading-6 text-slate-500"}>
                {materialPackage.error_message ?? "暂无错误。"}
              </p>
            </Card>
          </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function SourceCard({ source }: { source: MarketBriefMaterialPackageSource }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{source.id}</Badge>
        <Badge className="bg-slate-50 text-slate-600 ring-slate-200">{source.relevance}</Badge>
        {source.publisher ? <span className="text-xs font-medium text-slate-500">{source.publisher}</span> : null}
        {source.published_at ? <span className="text-xs text-slate-400">{source.published_at}</span> : null}
      </div>
      <h2 className="text-sm font-semibold text-slate-950">{source.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{source.snippet}</p>
      <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-500">Query：{source.query}</p>
      <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800">
        打开来源
        <ExternalLink size={13} />
      </a>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function TextListCard({ title, values, emptyText, tone }: { title: string; values: string[]; emptyText: string; tone: "blue" | "rose" }) {
  const itemClassName = tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700";

  return (
    <Card>
      <CardHeader title={title} />
      {values.length > 0 ? (
        <div className="space-y-2">
          {values.map((value, index) => (
            <p key={`${value}-${index}`} className={`rounded-2xl px-3 py-2 text-sm leading-6 ${itemClassName}`}>
              {value}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
    </Card>
  );
}

function JsonCard({ title, value }: { title: string; value: unknown }) {
  return (
    <Card>
      <CardHeader title={title} />
      <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </Card>
  );
}
