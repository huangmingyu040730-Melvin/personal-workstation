import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicPublicationCard } from "@/components/public/public-content-cards";
import { PublicEmptyState, PublicListToolbar, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { publicationTypes } from "@/lib/content-options";
import { getPublicPublications } from "@/lib/queries/publications";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "学术成果 | 黄铭语",
  description: "浏览黄铭语公开研究工作站中已公开的研究报告、策略分析、论文草稿与阅读综述。",
  path: "/publications"
});

export default async function PublicPublicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const publicationType = params.type ?? "all";
  const q = params.q ?? "";
  const publications = await getPublicPublications({ publicationType, q });
  const hasActiveFilters = Boolean(q.trim()) || publicationType !== "all";

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Publications"
        title="公开学术成果"
        description="浏览已公开的研究报告、论文草稿、策略分析与阅读综述。附件仍保持私密，不在公开页面提供下载。"
      />
      <section className="mx-auto max-w-[1320px] px-5 py-10 lg:px-8">
        <form className="mb-6 grid gap-3 rounded-3xl border border-earth-100 bg-white/82 p-4 shadow-soft md:grid-cols-[1fr_240px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-stone-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索成果标题、简介、摘要或标签..." className="h-10 w-full rounded-2xl border border-earth-100 bg-white pl-9 pr-3 text-sm text-earth-950 outline-none transition focus:border-earth-300" />
          </label>
          <select name="type" defaultValue={publicationType} className="h-10 rounded-2xl border border-earth-100 bg-white px-3 text-sm text-earth-950">
            <option value="all">全部类型</option>
            {publicationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <button className="h-10 rounded-2xl bg-earth-900 px-5 text-sm font-semibold text-paper-50 transition hover:bg-earth-950">筛选</button>
        </form>
        <PublicListToolbar count={publications.length} active={hasActiveFilters} clearHref="/publications" label="公开成果" />

        {publications.length === 0 ? (
          <PublicEmptyState title="暂无公开成果" description="正式报告与分析文章将在整理后发布。你也可以清空筛选后查看全部公开成果。" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publications.map((publication) => <PublicPublicationCard key={publication.id} publication={publication} />)}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
