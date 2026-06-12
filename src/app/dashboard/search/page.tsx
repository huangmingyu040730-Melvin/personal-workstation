import Link from "next/link";
import { Database, Search, ShieldCheck } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WorkspaceSearchResults } from "@/components/search/workspace-search-results";
import { normalizeWorkspaceSearchQuery, searchWorkspace, WORKSPACE_SEARCH_MIN_QUERY_LENGTH } from "@/lib/queries/search";

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardSearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = normalizeWorkspaceSearchQuery(getSingleSearchParam(params.q));
  const hasQuery = query.length > 0;
  const shouldSearch = query.length >= WORKSPACE_SEARCH_MIN_QUERY_LENGTH;
  const results = shouldSearch ? await searchWorkspace(query) : null;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Workspace Search"
          title="全局搜索"
          description="搜索 Projects、Publications、Knowledge、Skills、Documents 和文档包的 metadata。当前不搜索文件正文、OCR 或 AI 摘要。"
        />

        <AdminSection title="研究资产搜索" description="输入关键词后，将在后台研究资产中搜索标题、摘要、分类、文件名和文档包 metadata。">
          <form action="/dashboard/search" className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">搜索关键词</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                name="q"
                defaultValue={query}
                placeholder="搜索项目、知识笔记、成果、Skill、文件名或文档包…"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <div className="flex gap-2">
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-navy-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
                <Search size={16} />
                搜索
              </button>
              {hasQuery ? (
                <Link href="/dashboard/search" className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
                  清空
                </Link>
              ) : null}
            </div>
          </form>
        </AdminSection>

        <AdminSecurityNote>
          全局搜索只在管理员后台可用，只查询数据库 metadata；不会读取文件正文、解析压缩包、执行 OCR、生成 signed URL 或输出 Storage path。
        </AdminSecurityNote>

        {!hasQuery ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <AdminEmptyState
              title="输入关键词后开始搜索"
              description="输入关键词后，将在后台研究资产中搜索标题、摘要、分类、文件名和文档包 metadata。"
            />
            <AdminSection title="当前搜索范围" description="每类最多返回 8 条结果，不做分页。">
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <Database className="mt-0.5 shrink-0 text-blue-700" size={18} />
                  <p>Projects、Publications、Knowledge、Skills、Documents、Document Collections。</p>
                </div>
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={18} />
                  <p>只查后台可见 metadata，不搜索文件正文、Storage object、signed URL、OCR 或 AI 摘要。</p>
                </div>
              </div>
            </AdminSection>
          </div>
        ) : null}

        {hasQuery && !shouldSearch ? (
          <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            请输入至少 2 个字符。
          </div>
        ) : null}

        {results ? <WorkspaceSearchResults results={results} /> : null}
      </AdminPageSurface>
    </AppShell>
  );
}
