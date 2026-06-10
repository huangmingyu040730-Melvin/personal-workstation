import type { MarketBriefRecord } from "@/lib/content-types";

type MarketBriefChart = {
  id: string;
  title: string;
  type: "bar" | "pie" | "line";
  description?: string;
  x_key?: string;
  y_key?: string;
  name_key?: string;
  value_key?: string;
  unit?: string;
  data: Array<Record<string, unknown>>;
};

export function MarketBriefCharts({ brief }: { brief: Pick<MarketBriefRecord, "source_snapshot"> }) {
  const charts = getMarketBriefCharts(brief.source_snapshot);

  if (charts.length === 0) {
    return (
      <section className="market-brief-preview-toolbar rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">图表数据</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">暂无可靠图表数据，需人工复核。</p>
      </section>
    );
  }

  return (
    <section className="market-brief-preview-toolbar rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">图表数据</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">图表来自 AI structured output；空值或缺失值不会被渲染为精确数据。</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {charts.map((chart) => (
          <ChartCard key={chart.id} chart={chart} />
        ))}
      </div>
    </section>
  );
}

function ChartCard({ chart }: { chart: MarketBriefChart }) {
  const rows = chart.data.filter((row) => getNumericValue(row, chart) !== null);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{chart.title}</h3>
        {chart.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{chart.description}</p> : null}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">暂无可靠数据，需人工复核。</div>
      ) : null}
      {rows.length > 0 && chart.type === "bar" ? <BarChart chart={chart} rows={rows} /> : null}
      {rows.length > 0 && chart.type === "pie" ? <PieChart chart={chart} rows={rows} /> : null}
      {rows.length > 0 && chart.type === "line" ? <LineChart chart={chart} rows={rows} /> : null}
    </div>
  );
}

function BarChart({ chart, rows }: { chart: MarketBriefChart; rows: Array<Record<string, unknown>> }) {
  const values = rows.map((row) => Math.abs(getNumericValue(row, chart) ?? 0));
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const value = getNumericValue(row, chart) ?? 0;
        const label = getLabel(row, chart);
        const width = `${Math.max(4, Math.round((Math.abs(value) / max) * 100))}%`;
        const colorClass = value >= 0 ? "bg-rose-400" : "bg-emerald-500";
        return (
          <div key={`${label}-${index}`}>
            <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600">
              <span className="truncate">{label}</span>
              <span className="font-semibold text-slate-800">{formatValue(value, chart.unit)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ chart, rows }: { chart: MarketBriefChart; rows: Array<Record<string, unknown>> }) {
  const total = rows.reduce((sum, row) => sum + Math.max(0, getNumericValue(row, chart) ?? 0), 0);

  if (total <= 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">暂无可靠数据，需人工复核。</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const value = Math.max(0, getNumericValue(row, chart) ?? 0);
        const percentage = Math.round((value / total) * 100);
        const label = getLabel(row, chart);
        return (
          <div key={`${label}-${index}`}>
            <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600">
              <span className="truncate">{label}</span>
              <span className="font-semibold text-slate-800">{formatValue(value, chart.unit)} · {percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(3, percentage)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ chart, rows }: { chart: MarketBriefChart; rows: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const value = getNumericValue(row, chart) ?? 0;
        return (
          <div key={`${getLabel(row, chart)}-${index}`} className="flex justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs">
            <span className="truncate text-slate-600">{getLabel(row, chart)}</span>
            <span className="font-semibold text-slate-800">{formatValue(value, chart.unit)}</span>
          </div>
        );
      })}
    </div>
  );
}

function getMarketBriefCharts(sourceSnapshot: Record<string, unknown>) {
  const topLevelCharts = Array.isArray(sourceSnapshot.charts) ? sourceSnapshot.charts : [];
  const meta = isRecord(sourceSnapshot.meta) ? sourceSnapshot.meta : {};
  const metaCharts = Array.isArray(meta.charts) ? meta.charts : [];
  return [...topLevelCharts, ...metaCharts].map(normalizeChart).filter((chart): chart is MarketBriefChart => Boolean(chart));
}

function normalizeChart(value: unknown): MarketBriefChart | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = asText(value.type);
  if (type !== "bar" && type !== "pie" && type !== "line") {
    return null;
  }

  return {
    id: asText(value.id) || asText(value.title) || "market_brief_chart",
    title: asText(value.title) || "未命名图表",
    type,
    description: asText(value.description) ?? undefined,
    x_key: asText(value.x_key) ?? "name",
    y_key: asText(value.y_key) ?? "value",
    name_key: asText(value.name_key) ?? "name",
    value_key: asText(value.value_key) ?? "value",
    unit: asText(value.unit) ?? "",
    data: Array.isArray(value.data) ? value.data.filter(isRecord) : []
  };
}

function getLabel(row: Record<string, unknown>, chart: MarketBriefChart) {
  const key = chart.type === "pie" ? chart.name_key || "name" : chart.x_key || "name";
  return asText(row[key]) || asText(row.name) || asText(row.category) || "-";
}

function getNumericValue(row: Record<string, unknown>, chart: MarketBriefChart) {
  const key = chart.type === "pie" ? chart.value_key || "value" : chart.y_key || "value";
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace("%", "").replace(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatValue(value: number, unit = "") {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${text}${unit}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
