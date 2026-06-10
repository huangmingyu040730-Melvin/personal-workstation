import type { MarketBriefRecord } from "@/lib/content-types";

type MarketBriefSource = {
  id: string;
  title: string;
  url: string;
  publisher?: string | null;
  published_at?: string | null;
  snippet?: string | null;
  query?: string | null;
  relevance?: string | null;
};

export function MarketBriefSources({ brief }: { brief: Pick<MarketBriefRecord, "source_snapshot"> }) {
  const sources = getMarketBriefSources(brief.source_snapshot);

  return (
    <section className="market-brief-preview-toolbar rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">检索来源</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">来源仅用于后台复核。精确数字和图表数据应能追溯到这些 source id。</p>
      </div>
      {sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">暂无检索来源，需人工复核。</div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <article key={source.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">[{source.id}] {source.publisher || "未知来源"}{source.published_at ? ` · ${source.published_at}` : ""}</p>
                  <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-semibold leading-6 text-slate-950 hover:text-blue-700">
                    {source.title}
                  </a>
                </div>
                {source.relevance ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{source.relevance}</span> : null}
              </div>
              {source.snippet ? <p className="mt-2 text-sm leading-6 text-slate-600">{source.snippet}</p> : null}
              {source.query ? <p className="mt-2 text-xs leading-5 text-slate-400">Query: {source.query}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function getMarketBriefSources(sourceSnapshot: Record<string, unknown>) {
  const topLevelSources = Array.isArray(sourceSnapshot.sources) ? sourceSnapshot.sources : [];
  return topLevelSources.map(normalizeSource).filter((source): source is MarketBriefSource => Boolean(source));
}

function normalizeSource(value: unknown): MarketBriefSource | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asText(value.id);
  const title = asText(value.title);
  const url = asText(value.url);

  if (!id || !title || !url) {
    return null;
  }

  return {
    id,
    title,
    url,
    publisher: asText(value.publisher),
    published_at: asText(value.published_at),
    snippet: asText(value.snippet),
    query: asText(value.query),
    relevance: asText(value.relevance)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
