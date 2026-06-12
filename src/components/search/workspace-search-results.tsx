import { AdminEmptyState } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { SearchResultCard } from "@/components/search/search-result-card";
import type { WorkspaceSearchGroupKey, WorkspaceSearchResults as WorkspaceSearchResultsType } from "@/lib/queries/search";

const searchGroups: Array<{ key: WorkspaceSearchGroupKey; label: string; description: string }> = [
  { key: "projects", label: "Projects", description: "研究项目标题、摘要、研究问题、方法与标签。" },
  { key: "publications", label: "Publications", description: "成果标题、摘要、类型与标签。" },
  { key: "knowledge", label: "Knowledge", description: "知识笔记标题、摘要、分类、正文 metadata 与标签。" },
  { key: "skills", label: "Skills", description: "Skill 名称、说明、分类、平台与版本 metadata。" },
  { key: "documents", label: "Documents", description: "文件名、原始文件名、相对路径、分类和关联类型。" },
  { key: "collections", label: "Document Collections", description: "文档包标题、说明、类型、根文件夹和关联类型。" }
];

export function WorkspaceSearchResults({ results }: { results: WorkspaceSearchResultsType }) {
  if (results.totalCount === 0) {
    return <AdminEmptyState title="没有找到匹配结果" description="可以尝试更具体的项目名、文件名、文档包标题、分类或 Skill 平台关键词。" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4">
        <Badge className="bg-white text-blue-700 ring-blue-200">Search Results</Badge>
        <p className="text-sm leading-6 text-blue-900">
          共找到 <span className="font-semibold">{results.totalCount}</span> 条后台研究资产 metadata 命中结果。
        </p>
      </div>

      {searchGroups.map((group) => {
        const items = results[group.key];

        if (items.length === 0) {
          return null;
        }

        return (
          <section key={group.key} className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">{group.label}</p>
                <h2 className="text-xl font-semibold text-slate-950">{group.label === "Document Collections" ? "文档包" : group.label}</h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">{group.description}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <SearchResultCard key={`${group.key}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
