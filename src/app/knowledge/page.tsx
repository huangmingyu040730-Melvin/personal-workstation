import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicEmptyState, PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { knowledgeCategories } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getPublicKnowledgeNotes } from "@/lib/queries/knowledge";

export const metadata: Metadata = {
  title: "知识文章 | 黄铭语",
  description: "浏览黄铭语公开研究工作站中的公开知识文章、研究笔记、工具方法和阅读沉淀。"
};

export default async function PublicKnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const q = params.q ?? "";
  const notes = await getPublicKnowledgeNotes({ category, q });

  return (
    <PublicShell>
      <PublicPageHero
        eyebrow="Knowledge Base"
        title="公开知识文章"
        description="浏览已公开的研究笔记、工具方法、阅读沉淀与知识工作流。这里只展示明确公开的文章。"
      />
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <form className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_240px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input name="q" defaultValue={q} placeholder="搜索标题、摘要、正文或标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-300" />
          </label>
          <select name="category" defaultValue={category} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">全部分类</option>
            {knowledgeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="h-10 rounded-2xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">筛选</button>
        </form>

        {notes.length === 0 ? (
          <PublicEmptyState title="暂无公开知识文章" description="当前没有符合条件的公开知识文章。" />
        ) : (
          <Card>
            <CardHeader title="公开文章列表" description="按更新时间倒序展示" />
            <div className="space-y-3">
              {notes.map((note) => (
                <Link key={note.id} href={`/knowledge/${note.slug}`} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 transition hover:bg-emerald-50">
                  <div className="flex min-w-0 gap-3">
                    <BookOpen className="mt-1 shrink-0 text-emerald-600" size={18} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{note.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{note.category} · 更新于 {formatRelative(note.updated_at)}</p>
                      {note.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{note.excerpt}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {note.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">{tag}</span>)}
                      </div>
                    </div>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 sm:inline-flex">阅读 <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </section>
    </PublicShell>
  );
}
