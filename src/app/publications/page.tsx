import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PublicPublicationCard } from "@/components/public/public-content-cards";
import { buildPublicListingHref, PublicFilterChipGroup, PublicListingControls, PublicListingEmptyState, PublicListingHero } from "@/components/public/public-listing-shell";
import { PublicShell } from "@/components/public/public-shell";
import type { PublicationRecord } from "@/lib/content-types";
import { getPublicationTypeLabel, publicationTypes } from "@/lib/content-options";
import { getPublicPublications } from "@/lib/queries/publications";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "学术成果",
  description: "浏览公开研究报告、论文草稿、策略分析和阅读综述。",
  path: "/publications"
});

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesPublicationKeyword(publication: PublicationRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  return [publication.title, publication.summary, publication.abstract, publication.publication_type, ...(publication.tags ?? [])]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN")
    .includes(keyword);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function publicationTimestamp(publication: PublicationRecord) {
  return publication.published_on ?? publication.updated_at;
}

export default async function PublicPublicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const type = params.type ?? "all";
  const tag = params.tag ?? "all";
  const sort = params.sort === "oldest" || params.sort === "updated" ? params.sort : "newest";
  const currentFilters = { q, type, tag, sort };
  const allPublications = await getPublicPublications();
  const tags = uniqueSorted(allPublications.flatMap((publication) => publication.tags ?? []));
  const typeCount = new Set(allPublications.map((publication) => publication.publication_type)).size;
  const publications = allPublications
    .filter((publication) => type === "all" || publication.publication_type === type)
    .filter((publication) => tag === "all" || publication.tags.includes(tag))
    .filter((publication) => matchesPublicationKeyword(publication, q))
    .sort((a, b) => {
      if (sort === "oldest") {
        return publicationTimestamp(a).localeCompare(publicationTimestamp(b));
      }

      if (sort === "updated") {
        return b.updated_at.localeCompare(a.updated_at);
      }

      return publicationTimestamp(b).localeCompare(publicationTimestamp(a));
    });
  const hasActiveFilters = Boolean(q.trim()) || type !== "all" || tag !== "all" || sort !== "newest";

  return (
    <PublicShell>
      <PublicListingHero
        eyebrow="Publications"
        title="公开学术成果"
        description="公开展示整理完成的报告、论文草稿、策略分析和阅读综述。私密附件和内部文件字段不会出现在公开页面。"
        stats={[
          { label: "公开成果", value: allPublications.length },
          { label: "成果类型", value: typeCount },
          { label: "筛选结果", value: publications.length },
          { label: "标签维度", value: tags.length }
        ]}
      />
      <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 2xl:px-16">
        <PublicListingControls count={publications.length} active={hasActiveFilters} clearHref="/publications" label="公开成果">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
            {tag !== "all" ? <input type="hidden" name="tag" value={tag} /> : null}
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
              <input name="q" defaultValue={q} placeholder="搜索成果标题、简介、摘要或标签..." className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none transition focus:border-blue-300" />
            </label>
            <select name="type" defaultValue={type} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="all">全部类型</option>
              {publicationTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select name="sort" defaultValue={sort} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-navy-950">
              <option value="newest">发表时间新到旧</option>
              <option value="oldest">发表时间旧到新</option>
              <option value="updated">最近更新优先</option>
            </select>
            <button className="h-10 rounded-2xl bg-navy-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-800">浏览</button>
          </form>
          <PublicFilterChipGroup
            label="按标签浏览"
            options={[
              { label: "全部标签", href: buildPublicListingHref("/publications", currentFilters, { tag: "all" }), active: tag === "all" },
              ...tags.map((item) => ({ label: item, href: buildPublicListingHref("/publications", currentFilters, { tag: item }), active: tag === item }))
            ]}
          />
          <PublicFilterChipGroup
            label="成果类型"
            options={[
              { label: "全部类型", href: buildPublicListingHref("/publications", currentFilters, { type: "all" }), active: type === "all" },
              ...publicationTypes.map((item) => ({ label: getPublicationTypeLabel(item.value), href: buildPublicListingHref("/publications", currentFilters, { type: item.value }), active: type === item.value }))
            ]}
          />
        </PublicListingControls>

        {publications.length === 0 ? (
          <PublicListingEmptyState title="暂无符合条件的公开成果" description="当前筛选没有匹配的 public 成果。可以清空筛选，或返回列表查看全部公开成果。" actionHref="/publications" actionLabel="清空筛选" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publications.map((publication) => <PublicPublicationCard key={publication.id} publication={publication} />)}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
