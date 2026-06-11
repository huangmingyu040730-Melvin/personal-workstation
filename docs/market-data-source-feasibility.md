# Market Data Source Feasibility

Phase 2N-C0 only adds a local diagnostics probe for A-share market data sources. It does not change the Market Brief generation path, material package collection API, database schema, cron setup, Supabase policies, or any dashboard behavior.

## Probe Boundary

- The probe lives in `scripts/market-data-source-probe/` and runs from the local terminal.
- It does not call `/api/market-briefs/*`, does not write to `market_brief_material_packages`, and does not use a Supabase service role key.
- It does not restore the removed external runner, Python runner, or `skill-result` callback path.
- It does not make AKShare, Eastmoney, or any exchange endpoint the production default.
- Tavily remains only a supplemental news/search source for material collection and is not treated as a market facts source.

## Candidate Sources

| Source | Probe id | Purpose | Current feasibility note |
| --- | --- | --- | --- |
| AKShare SSE summary | `akshare_stock_sse_summary` | Check whether AKShare can expose SSE market summary fields. | Diagnostic wrapper only; target-date support depends on upstream wrapper behavior and local AKShare availability. |
| AKShare SZSE summary | `akshare_stock_szse_summary` | Check whether AKShare can expose SZSE summary fields for a requested date. | Diagnostic wrapper only; cannot be core until repeated date coverage passes. |
| SSE daily stock summary | `sse_official_daily_stock_summary` | Direct official-source probe for date-scoped SSE stock summary data. | Preferred candidate for future official direct adapter if repeat checks keep passing. |
| SZSE market overview | `szse_official_market_overview` | Direct official-source probe for SZSE market overview by query date. | Preferred candidate for future official direct adapter if repeat checks keep passing. |
| SZSE daily stock summary | `szse_official_daily_stock_summary` | Direct official-source probe for SZSE daily stock situation by query date. | Preferred candidate for future official direct adapter if repeat checks keep passing. |
| Eastmoney current index snapshot | `eastmoney_optional_index_snapshot` | Optional fallback signal for current index quote shape only. | Not reliable enough to support a ready conclusion alone and cannot validate historical package dates. |

## How To Run

Recent trading day:

```bash
python3 scripts/market-data-source-probe/probe_ashare_sources.py --date 2026-06-10
```

Explicit repeat, timeout, and output file:

```bash
python3 scripts/market-data-source-probe/probe_ashare_sources.py \
  --date 2026-06-10 \
  --repeat 3 \
  --timeout-ms 10000 \
  --output /tmp/ashare-source-probe.json
```

Historical trading day:

```bash
python3 scripts/market-data-source-probe/probe_ashare_sources.py --date 2024-12-31 --repeat 3
```

AKShare is optional for this diagnostics script. If it is not installed, the AKShare entries are recorded as failed and the official-source probes still run.

## Result Interpretation

- `ok`: all repeat attempts returned rows, required count / turnover / market value fields, and target-date confirmation where applicable.
- `partial`: at least one attempt returned useful rows, but the source did not meet every requirement.
- `failed`: no usable attempt returned.
- `coverage.turnover=ok` is necessary but not sufficient for production adoption.
- `coverage.market_breadth` and `coverage.sectors` may remain `missing`; those gaps should be handled by an additional official source, manual input, or CSV import before any production adapter is promoted.

## Local Probe Snapshot

On 2026-06-11, the local probe was run for `2026-06-10` with `--repeat 3` and for historical date `2024-12-31` with `--repeat 1`.

- Passed: `sse_official_daily_stock_summary` and `szse_official_market_overview` returned target-date rows with required count / turnover / market value fields for both dates.
- Partial: `szse_official_daily_stock_summary` returned target-date rows but did not include all required count / turnover / market value fields by itself.
- Partial: `eastmoney_optional_index_snapshot` returned current index-like data, but it cannot validate historical target dates and had an unstable repeat result in the recent-date run.
- Failed locally: `akshare_stock_sse_summary` and `akshare_stock_szse_summary` because AKShare is not installed in the local environment; this is not evidence that the upstream endpoints are unavailable, only that AKShare cannot be treated as an already-ready dependency here.
- Coverage result: turnover was `ok`; indices were `partial`; market breadth and sectors were `missing`.

## Current Recommendation

Use Phase 2N-C0 to collect local evidence across at least one recent trading day and one specified historical trading day. If the direct SSE and SZSE official probes keep returning stable date-scoped rows with turnover, market value, and listing-count fields, the next implementation phase should design a small official-source adapter for material-package collection.

AKShare should not be adopted as the core collection source yet. It is useful as a local wrapper diagnostic, but it adds another dependency layer and may not reliably prove historical target-date coverage.

Eastmoney should remain an optional fallback probe only. Prior lock/block behavior means it cannot be the sole basis for a `ready` material package conclusion.

If official-source repeat checks fail or field coverage stays incomplete, the safer next phase is manual entry / CSV import for exchange summary tables, then AI generation from reviewed material packages.

## Phase 2N-C1 Adoption

Phase 2N-C1 promotes only the official SSE / SZSE summary and overview probes into the manual material package collection flow. The implementation uses Node `fetch`, not Python, AKShare, or Eastmoney, and writes results into existing `market_brief_material_packages.source_snapshot`, `sources`, `extracted_facts.exchange_summary`, `warnings`, and `source_notes`.

The collector records official summary sources as `source_type=official_exchange_summary`. Tavily / Serper / custom search remains supplemental search for news and topic context only; it is not treated as a market facts source.

Newly collected packages remain at most `partial` because market breadth, sector performance, and capital flow coverage are still missing. A package can still be used for AI generation, but the generated output keeps `needs_review` / `ai_grounded_partial` semantics and must preserve `exchange_summary` in `source_snapshot.extracted_facts`.

Phase 2N-C1 does not add cron, migrations, secrets, AKShare production dependency, Eastmoney production dependency, investment advice, stock recommendations, or automatic publishing.
