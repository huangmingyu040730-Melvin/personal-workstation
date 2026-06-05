import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileText, Search } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicEmptyState, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { getPublicationTypeLabel, publicationTypes } from "@/lib/content-options";
import { formatDate, formatRelative } from "@/lib/format";
import { getPublicPublications } from "@/lib/queries/publications";

export const metadata: Metadata = {
  title: "学术成果 | 黄铭语",
  description: "浏览黄铭语公开研究工作站中已公开的研究报告、策略分析、论文草稿与阅读综述。"
};

export default async function PublicPublicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const publicationType = params.type ?? "all";
  const q = params.q ?? "";
  const publications = await getPublicPublications({ publicationType, q });

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Publications"
        title="公开学术成果"
        description="浏览已公开的研究报告、论文草稿、策略分析与阅读综述。附件仍保持私密，不在公开页面提供下载。"
      />
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <form className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_240px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索成果标题、简介、摘要或标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </label>
          <select name="type" defaultValue={publicationType} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">全部类型</option>
            {publicationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <button className="h-10 rounded-2xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">筛选</button>
        </form>

        {publications.length === 0 ? (
          <PublicEmptyState title="暂无公开成果" description="当前没有符合条件的公开学术成果。" />
        ) : (
          <Card>
            <CardHeader title="公开成果列表" description="精选内容优先展示，其后按发布日期与更新时间排序" />
            <div className="space-y-3">
              {publications.map((publication) => (
                <Link key={publication.id} href={`/publications/${publication.slug}`} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-1 shrink-0 text-blue-700" size={18} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        {publication.is_featured ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">精选</span> : null}
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{getPublicationTypeLabel(publication.publication_type)}</span>
                      </div>
                      <p className="mt-2 font-medium text-slate-900">{publication.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(publication.published_on)} · 更新于 {formatRelative(publication.updated_at)}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{publication.summary}</p>
                    </div>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 sm:inline-flex">详情 <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </section>
    </PublicShell>
  );
}
