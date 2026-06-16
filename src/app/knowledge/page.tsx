import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicKnowledgeCard } from "@/components/public/public-content-cards";
import { buildPublicListingHref, PublicFilterChipGroup, PublicListingControls, PublicListingEmptyState, PublicListingHero } from "@/components/public/public-listing-shell";
import { PublicShell } from "@/components/public/public-shell";
import type { KnowledgeNoteRecord } from "@/lib/content-types";
import { knowledgeCategories } from "@/lib/content-options";
import { getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "知识库",
  description: "浏览公开知识笔记、研究文章、工具方法和阅读沉淀。",
  path: "/knowledge"
});

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKnowledgeKeyword(note: KnowledgeNoteRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  return [note.title, note.excerpt, note.content, note.category, ...(note.tags ?? [])]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN")
    .includes(keyword);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export default async function PublicKnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "all";
  const tag = params.tag ?? "all";
  const currentFilters = { q, category, tag };
  const allNotes = await getPublicKnowledgeNotes();
  const tags = uniqueSorted(allNotes.flatMap((note) => note.tags ?? []));
  const categories = uniqueSorted([...knowledgeCategories, ...allNotes.map((note) => note.category)]);
  const notes = allNotes
    .filter((note) => category === "all" || note.category === category)
    .filter((note) => tag === "all" || note.tags.includes(tag))
    .filter((note) => matchesKnowledgeKeyword(note, q));
  const hasActiveFilters = Boolean(q.trim()) || category !== "all" || tag !== "all";

  return (
    <PublicShell>
      <PublicListingHero
        eyebrow="Knowledge Base"
        title="公开知识库"
        description="把研究方法、阅读笔记和工具经验整理成可浏览的公开知识索引。这里只展示 public 内容，不泄露未公开正文或私密附件。"
        stats={[
          { label: "公开文章", value: allNotes.length },
          { label: "知识分类", value: categories.length },
          { label: "筛选结果", value: notes.length },
          { label: "标签维度", value: tags.length }
        ]}
      />
      <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
        <PublicListingControls count={notes.length} active={hasActiveFilters} clearHref="/knowledge" label="公开知识笔记">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
            {tag !== "all" ? <input type="hidden" name="tag" value={tag} /> : null}
            <label className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
              <input name="q" defaultValue={q} placeholder="搜索标题、摘要、正文或标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-blue-300" />
            </label>
            <select name="category" defaultValue={category} className="h-10 min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="all">全部分类</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className="h-10 rounded-2xl bg-navy-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-800">浏览</button>
          </form>
          <PublicFilterChipGroup
            label="按标签浏览"
            options={[
              { label: "全部标签", href: buildPublicListingHref("/knowledge", currentFilters, { tag: "all" }), active: tag === "all" },
              ...tags.map((item) => ({ label: item, href: buildPublicListingHref("/knowledge", currentFilters, { tag: item }), active: tag === item }))
            ]}
          />
          <PublicFilterChipGroup
            label="知识分类"
            options={[
              { label: "全部分类", href: buildPublicListingHref("/knowledge", currentFilters, { category: "all" }), active: category === "all" },
              ...categories.map((item) => ({ label: item, href: buildPublicListingHref("/knowledge", currentFilters, { category: item }), active: category === item }))
            ]}
          />
        </PublicListingControls>

        {notes.length === 0 ? (
          <PublicListingEmptyState title="暂无符合条件的公开知识笔记" description="当前筛选没有匹配的 public 知识笔记。可以清空筛选，或返回列表查看全部公开知识。" actionHref="/knowledge" actionLabel="清空筛选" />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {notes.map((note) => <PublicKnowledgeCard key={note.id} note={note} />)}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
