import Link from "next/link";
import { Activity, Filter, ShieldCheck } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { formatDateTime } from "@/lib/format";
import {
  getRecentWorkstationOperationLogs,
  normalizeWorkstationLogFilters,
  WORKSTATION_LOG_ACTIONS,
  WORKSTATION_LOG_STATUSES,
  WORKSTATION_LOG_TARGET_TYPES,
  type WorkstationOperationLogRecord
} from "@/lib/queries/workstation-logs";

function statusClass(status: string) {
  return status === "success"
    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
    : "border-rose-100 bg-rose-50 text-rose-700";
}

function compactSummary(summary: Record<string, unknown> | null) {
  if (!summary || Object.keys(summary).length === 0) {
    return "无摘要";
  }

  return Object.entries(summary)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      const rendered = Array.isArray(value)
        ? `${value.length} items`
        : String(value).replace(/\s+/g, " ").slice(0, 80);
      return `${key}: ${rendered}`;
    })
    .join(" · ") || "无摘要";
}

function FilterSelect({
  label,
  name,
  value,
  options
}: {
  label: string;
  name: string;
  value: string | null;
  options: readonly string[];
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function WorkstationLogTable({ logs }: { logs: WorkstationOperationLogRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full border-separate border-spacing-y-2 text-left text-sm">
        <thead className="text-xs uppercase text-slate-400">
          <tr>
            <th className="px-3 py-2 font-semibold">request_id</th>
            <th className="px-3 py-2 font-semibold">action</th>
            <th className="px-3 py-2 font-semibold">status</th>
            <th className="px-3 py-2 font-semibold">http</th>
            <th className="px-3 py-2 font-semibold">target</th>
            <th className="px-3 py-2 font-semibold">created_at</th>
            <th className="px-3 py-2 font-semibold">error_code</th>
            <th className="px-3 py-2 font-semibold">summary</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="rounded-2xl bg-slate-50 align-top">
              <td className="rounded-l-2xl px-3 py-3 font-mono text-xs text-slate-700">{log.request_id}</td>
              <td className="px-3 py-3">
                <div className="font-semibold text-slate-900">{log.action}</div>
                <div className="mt-1 font-mono text-xs text-slate-400">{log.method} {log.route}</div>
              </td>
              <td className="px-3 py-3">
                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(log.status)}`}>
                  {log.status}
                </span>
              </td>
              <td className="px-3 py-3 font-mono text-xs text-slate-600">{log.http_status ?? "-"}</td>
              <td className="px-3 py-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">{log.target_type ?? "-"}</div>
                <div className="mt-1 max-w-[180px] break-all font-mono text-slate-400">{log.target_id ?? "-"}</div>
              </td>
              <td className="px-3 py-3 text-xs text-slate-600">{formatDateTime(log.created_at)}</td>
              <td className="px-3 py-3 font-mono text-xs text-slate-600">{log.error_code ?? "-"}</td>
              <td className="rounded-r-2xl px-3 py-3 text-xs leading-5 text-slate-600">{compactSummary(log.request_summary)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function WorkstationLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = normalizeWorkstationLogFilters(params);
  const { logs, error } = await getRecentWorkstationOperationLogs(filters);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Developer"
          title="Workstation Logs"
          description="查看 Workstation Admin API 最近 100 条调用日志，用于排查 Codex / CLI 请求、权限错误和 requestId。"
        />

        <AdminSecurityNote>
          这里仅展示安全审计摘要：request_id、action、status、http_status、target 和精简 request_summary；不展示 token、Authorization header、service role key、Storage path、signed URL、Documents 正文或完整请求体。
        </AdminSecurityNote>

        <AdminSection
          title="日志筛选"
          description="筛选只作用于最近 Workstation API operation logs，不查询 Documents 正文或 Storage object。"
        >
          <form action="/dashboard/developer/workstation-logs" className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <FilterSelect label="status" name="status" value={filters.status} options={WORKSTATION_LOG_STATUSES} />
            <FilterSelect label="action" name="action" value={filters.action} options={WORKSTATION_LOG_ACTIONS} />
            <FilterSelect label="target_type" name="target_type" value={filters.targetType} options={WORKSTATION_LOG_TARGET_TYPES} />
            <div className="flex gap-2">
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-800">
                <Filter size={16} />
                筛选
              </button>
              <Link href="/dashboard/developer/workstation-logs" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
                清空
              </Link>
            </div>
          </form>
        </AdminSection>

        {error ? (
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-medium text-amber-800">
            {error}
          </div>
        ) : null}

        <AdminSection
          title="最近调用"
          description="最多展示最近 100 条 Workstation API 请求。"
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Activity size={14} />
              {logs.length} 条
            </div>
          }
        >
          {logs.length > 0 ? (
            <WorkstationLogTable logs={logs} />
          ) : (
            <AdminEmptyState
              title="暂无 Workstation logs"
              description="当 CLI 或 Workstation API 被调用后，这里会展示最近的安全审计摘要。"
              action={<ShieldCheck className="mx-auto text-blue-700" size={22} />}
            />
          )}
        </AdminSection>
      </AdminPageSurface>
    </AppShell>
  );
}
