# A-share Data Source Feasibility Probe

This directory is for Phase 2N-C0 diagnostics only. It is not a Market Brief production runner, does not call project APIs, does not write to Supabase, does not require secrets, and does not restore the removed external / Python / skill-result runner paths.

## Scope

- Probe whether candidate A-share market data sources can return usable records.
- Check whether fields are sufficient for a future market material package: count, turnover, market value, target-date coverage, and coarse coverage gaps.
- Record per-source repeat attempts and safe error summaries.
- Keep AKShare and Eastmoney as diagnostic probes only; neither is adopted as the default production source here.

## Sources Probed

- `akshare_stock_sse_summary`: local AKShare wrapper around SSE summary data.
- `akshare_stock_szse_summary`: local AKShare wrapper around SZSE summary data.
- `sse_official_daily_stock_summary`: SSE public daily stock summary query.
- `szse_official_market_overview`: SZSE public `ShowReport` market overview catalog.
- `szse_official_daily_stock_summary`: SZSE public `ShowReport` daily stock summary catalog.
- `eastmoney_optional_index_snapshot`: optional current index snapshot fallback probe only.

## Run

AKShare is optional. If it is not installed, the AKShare source entries are reported as `failed` and the rest of the probe continues.

```bash
python3 scripts/market-data-source-probe/probe_ashare_sources.py --date 2026-06-10
```

```bash
python3 scripts/market-data-source-probe/probe_ashare_sources.py \
  --date 2026-06-10 \
  --repeat 3 \
  --timeout-ms 10000 \
  --output /tmp/ashare-source-probe.json
```

Optional local-only AKShare install:

```bash
python3 -m pip install akshare pandas
```

Do not commit virtual environments, dependency caches, or generated probe outputs unless a future task explicitly asks for a dated evidence artifact.

## Output

The probe writes JSON with:

- `environment`: Python and AKShare versions plus local network marker.
- `sources`: one entry per source with `status`, repeat attempts, latency, row/column shape, target-date coverage, required field presence, sample fields, and safe error summary.
- `coverage`: coarse `indices`, `turnover`, `market_breadth`, and `sectors` coverage.
- `recommendation`: whether AKShare or official exchange sources look usable for a future core material package.

`ok` means all attempts returned rows with required fields and, for date-scoped sources, target-date confirmation. `partial` means the source returned something useful but did not satisfy every requirement. `failed` means no usable attempt succeeded.
