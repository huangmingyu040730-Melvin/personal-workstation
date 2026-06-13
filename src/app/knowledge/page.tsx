import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicKnowledgeCard } from "@/components/public/public-content-cards";
import { PublicEmptyState, PublicListToolbar, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { knowledgeCategories } from "@/lib/content-options";
import { getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "知识库 | 黄铭语",
  description: "浏览黄铭语公开研究工作站中的公开知识笔记、研究文章、工具方法和阅读沉淀。",
  path: "/knowledge"
});

export default async function PublicKnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const q = params.q ?? "";
  const notes = await getPublicKnowledgeNotes({ category, q });
  const hasActiveFilters = Boolean(q.trim()) || category !== "all";

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Knowledge Base"
        title="公开知识库"
        description="浏览已公开的研究笔记、工具方法、阅读沉淀与知识工作流。这里只展示明确公开的内容。"
      />
      <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
        <form className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_240px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索标题、摘要、正文或标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-blue-300" />
          </label>
          <select name="category" defaultValue={category} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
            <option value="all">全部分类</option>
            {knowledgeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="h-10 rounded-2xl bg-navy-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-800">筛选</button>
        </form>
        <PublicListToolbar count={notes.length} active={hasActiveFilters} clearHref="/knowledge" label="公开文章" />

        {notes.length === 0 ? (
          <PublicEmptyState title="暂无公开知识文章" description="研究笔记、工具方法和阅读沉淀会在整理后逐步开放。" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => <PublicKnowledgeCard key={note.id} note={note} />)}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
