import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Edit, FileJson, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { MarketBriefPrintButton } from "@/components/market-brief-print-button";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefGenerationStatusLabel } from "@/lib/content-options";
import { formatDate } from "@/lib/format";
import { buildMarketBriefMarkdown, getMarketBriefMarkdownSourceLabel } from "@/lib/market-brief-markdown";
import { getMarketBriefGenerationStatusTone } from "@/lib/market-briefs";
import { MarkdownPreview } from "@/lib/markdown";
import { getMarketBriefById } from "@/lib/queries/market-briefs";

export default async function MarketBriefPreviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const brief = await getMarketBriefById(id);

  if (!brief) {
    notFound();
  }

  const markdown = buildMarketBriefMarkdown(brief);
  const notice = Array.isArray(query.notice) ? query.notice[0] : query.notice;

  return (
    <AppShell>
      <AdminPageSurface className="market-brief-preview-page">
        <div className="market-brief-preview-toolbar space-y-4">
          <PageHeader
            eyebrow="Market Brief Preview"
            title={`${brief.title} · 站内预览`}
            description="Markdown 为市场简报主内容源，站内预览用于快速浏览和打印。"
            action={
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/market-briefs/${brief.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <ArrowLeft size={16} />
                  返回详情
                </Link>
                <Link href={`/dashboard/market-briefs/${brief.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <Edit size={16} />
                  编辑
                </Link>
                <Link href={`/dashboard/market-briefs/${brief.id}/download/markdown`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <FileText size={16} />
                  下载 Markdown
                </Link>
                <Link href={`/dashboard/market-briefs/${brief.id}/download/html`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <Download size={16} />
                  下载 HTML
                </Link>
                <Link href={`/dashboard/market-briefs/${brief.id}/download/json`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <FileJson size={16} />
                  下载 JSON
                </Link>
                <Link href={`/dashboard/market-briefs/${brief.id}/download/docx`} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100">
                  <Download size={16} />
                  下载 Word
                </Link>
                <MarketBriefPrintButton />
              </div>
            }
          />

          <AdminSecurityNote>
            这是后台私密预览页，仅管理员可访问。下载文件即时生成，不写入 Storage，不创建公开下载链接，不调用 AI。
          </AdminSecurityNote>

          {notice === "generated" ? <PreviewNotice tone="emerald" message="今日市场简报草稿已生成。当前使用 mock generator，尚未接入真实行情数据。" /> : null}
          {notice === "exists" ? <PreviewNotice tone="blue" message="今日市场简报已存在，已跳转到已有预览页，未重复创建。" /> : null}
          {brief.generator_name === "manual-skill-mock" ? <PreviewNotice tone="slate" message="本简报由 manual-skill-mock 生成，当前尚未接入真实行情数据。" /> : null}
        </div>

        <div className="market-brief-paper-wrap">
          <article className="market-brief-paper">
            <div className="mb-6 flex flex-wrap gap-2 text-sm">
              <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{brief.market}</Badge>
              <Badge className={getMarketBriefGenerationStatusTone(brief.generation_status)}>{getMarketBriefGenerationStatusLabel(brief.generation_status)}</Badge>
              <Badge className="bg-slate-50 text-slate-600 ring-slate-200">{getMarketBriefMarkdownSourceLabel(brief)}</Badge>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{formatDate(brief.brief_date)}</span>
            </div>
            <MarkdownPreview content={markdown} emptyText="暂无可预览内容。" />
          </article>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function PreviewNotice({ message, tone }: { message: string; tone: "blue" | "emerald" | "slate" }) {
  const className = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-white text-slate-600"
  }[tone];

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>{message}</div>;
}
