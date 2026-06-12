import Link from "next/link";
import { AdminEmptyState } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { SearchResultCard } from "@/components/search/search-result-card";
import { WORKSPACE_SEARCH_GROUP_LABELS } from "@/lib/queries/search";
import type { WorkspaceSearchGroupKey, WorkspaceSearchResults as WorkspaceSearchResultsType, WorkspaceSearchType } from "@/lib/queries/search";

const searchGroups: Array<{ key: WorkspaceSearchGroupKey; label: string; title: string; description: string }> = [
  { key: "projects", label: WORKSPACE_SEARCH_GROUP_LABELS.projects, title: "Projects", description: "研究项目标题、摘要、研究问题、方法与标签。" },
  { key: "publications", label: WORKSPACE_SEARCH_GROUP_LABELS.publications, title: "Publications", description: "成果标题、摘要、类型与标签。" },
  { key: "knowledge", label: WORKSPACE_SEARCH_GROUP_LABELS.knowledge, title: "Knowledge", description: "知识笔记标题、摘要、分类、正文 metadata 与标签。" },
  { key: "skills", label: WORKSPACE_SEARCH_GROUP_LABELS.skills, title: "Skills", description: "Skill 名称、说明、分类、平台与版本 metadata。" },
  { key: "documents", label: WORKSPACE_SEARCH_GROUP_LABELS.documents, title: "Documents", description: "文件名、原始文件名、相对路径、分类和关联类型。" },
  { key: "collections", label: WORKSPACE_SEARCH_GROUP_LABELS.collections, title: "文档包", description: "文档包标题、说明、类型、根文件夹和关联类型。" }
];

type WorkspaceSearchResultsProps = {
  results: WorkspaceSearchResultsType;
  selectedType: WorkspaceSearchType;
};

function buildTypeHref(query: string, type: WorkspaceSearchType) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("type", type);

  return `/dashboard/search?${params.toString()}`;
}

export function WorkspaceSearchResults({ results, selectedType }: WorkspaceSearchResultsProps) {
  if (results.totalCount === 0) {
    return <AdminEmptyState title="没有找到匹配结果" description="可以尝试更具体的项目名、文件名、文档包标题、分类或 Skill 平台关键词。" />;
  }

  const visibleGroups = selectedType === "all"
    ? searchGroups
    : searchGroups.filter((group) => group.key === selectedType);
  const selectedCount = selectedType === "all" ? results.totalCount : results[selectedType].length;
  const filters: Array<{ type: WorkspaceSearchType; label: string; count: number }> = [
    { type: "all", label: "全部", count: results.totalCount },
    ...searchGroups.map((group) => ({
      type: group.key,
      label: group.label,
      count: results[group.key].length
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4">
        <Badge className="bg-white text-blue-700 ring-blue-200">Search Results</Badge>
        <p className="text-sm leading-6 text-blue-900">
          共找到 <span className="font-semibold">{results.totalCount}</span> 条后台研究资产 metadata 命中结果。
          {selectedType === "all" ? null : (
            <>
              {" "}当前筛选显示 <span className="font-semibold">{selectedCount}</span> 条。
            </>
          )}
        </p>
      </div>

      <nav aria-label="搜索结果类型筛选" className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = filter.type === selectedType;

          return (
            <Link
              key={filter.type}
              href={buildTypeHref(results.query, filter.type)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                isActive
                  ? "border-blue-200 bg-blue-700 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
              ].join(" ")}
            >
              <span>{filter.label}</span>
              <span className={isActive ? "text-blue-100" : "text-slate-400"}>{filter.count}</span>
            </Link>
          );
        })}
      </nav>

      {selectedType !== "all" && selectedCount === 0 ? (
        <AdminEmptyState title="当前类型没有匹配结果" description="可以切回“全部”，或尝试更具体的项目名、文件名、文档包标题、分类或 Skill 平台关键词。" />
      ) : null}

      {visibleGroups.map((group) => {
        const items = results[group.key];

        if (items.length === 0) {
          return null;
        }

        return (
          <section key={group.key} className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">{group.label}</p>
                <h2 className="text-xl font-semibold text-slate-950">
                  {group.title} <span className="text-base font-medium text-slate-400">({items.length})</span>
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">{group.description}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <SearchResultCard key={`${group.key}-${item.id}`} item={item} query={results.query} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
