# Python AkShare Market Brief Runner

Phase 2L-D-C adds a first real-data runner for A-share market briefs. Phase 2L-D-D adds fallback brief generation when AkShare or Eastmoney endpoints are unavailable. Phase 2L-D-E adds multi-source mode and historical trading-day jobs.

The runner claims queued jobs from the workstation, fetches market data with lightweight HTTP sources and/or AkShare, writes a stable `source_snapshot`, generates Markdown, and sends the result back through the existing private API.

It does not need a Supabase key. It only needs the workstation base URL and runner secret.

## Install

```bash
cd scripts/market-brief-runner/python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

Recommended local setup:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
WORKSTATION_BASE_URL="https://personal-workstation.vercel.app"
MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
MARKET_BRIEF_MARKET="A股"
MARKET_BRIEF_RUNNER_NAME="akshare-runner"
MARKET_BRIEF_DATA_MODE="multi"
```

Defaults:

- `MARKET_BRIEF_MARKET=A股`
- `MARKET_BRIEF_RUNNER_NAME=akshare-runner`
- `MARKET_BRIEF_DATA_MODE=multi`

Supported data modes:

- `multi`: try lightweight HTTP index data first, then AkShare, then fallback.
- `akshare`: use AkShare only.
- `mock`: return a fallback snapshot for manual review without calling market data sources.

The runner automatically checks the current shell plus `.env.local` / `.env` in:

- the current working directory;
- `scripts/market-brief-runner/python`;
- the project root.

Shell exports still win over file values. Do not commit real secrets. Do not pass Supabase keys to this runner.

## Run

```bash
cd scripts/market-brief-runner/python
python run_market_brief_runner.py
```

To diagnose only the claim API without fetching AkShare data or writing a result:

```bash
python run_market_brief_runner.py --diagnose
```

Diagnose mode prints the base URL, market, runner name, masked runner secret metadata, claim URL, HTTP status, and response body. It does not call AkShare, `skill-result`, or `skill-jobs/fail`.

Flow:

1. `POST /api/market-briefs/skill-jobs/claim`
2. If no queued job exists, print `No queued market brief generation job found. This usually means the site has no queued job, or MARKET_BRIEF_GENERATOR is not external.` and exit 0.
3. Fetch A-share market data with the configured data mode.
4. Classify `source_snapshot.meta.data_quality` as `real`, `partial`, or `fallback`.
5. Build Markdown. If all core data sources fail, build a fallback Markdown draft for manual review.
6. `POST /api/market-briefs/skill-result`
7. Print the returned preview URL.

If the runner claims a job but cannot fetch any core module, it no longer fails the job by default. It sends a fallback result payload with:

```text
source_snapshot.meta.data_quality = fallback
source_snapshot.meta.is_fallback = true
generation_status = needs_review
```

The runner calls `POST /api/market-briefs/skill-jobs/fail` only if the result API fails or local code cannot build a Markdown payload.

## Data Scope

Current first version attempts to fetch:

- Broad indices: 上证指数、深证成指、创业板指、沪深300、中证500、中证1000、中证2000、中证红利、科创50、北证50
- Market breadth: up/down/flat counts, limit-up/limit-down counts, total turnover
- Sectors: top 10 gainers and top 10 losers from AkShare industry board data
- Hot topics: top industry and concept board directions

Unavailable fields are saved as `null` or empty arrays. Module-level failures are written to `source_snapshot.meta.warnings`.

Data quality rules:

- `real`: at least two core modules have data and at least five target indices are available.
- `partial`: at least one core module has data, or at least three target indices are available.
- `fallback`: no core module has data.

Core modules are `indices`, `market_breadth`, and `sectors`.

## Historical Jobs

The website can create jobs for a specified A-share trading day. The server validates that the selected `brief_date` is not in the future and is included in the local A-share trading calendar before creating the job.

The runner always uses `job["brief_date"]` from the claim response. It does not replace the job date with the local current date.

If `job["brief_date"]` is not today in Asia/Shanghai, the runner writes:

```text
source_snapshot.meta.is_historical = true
```

Latest-only sources are skipped for historical jobs. For example, the HTTP Eastmoney index snapshot is not used for historical dates and records:

```text
HTTP index source only supports latest snapshot; skipped for historical brief_date.
```

If historical data is incomplete, the runner still returns a `partial` or `fallback` Markdown brief with `generation_status=needs_review` for manual review. It must not use latest market snapshots as historical data.

## Snapshot Shape

```json
{
  "meta": {
    "market": "A股",
    "brief_date": "2026-06-10",
    "is_historical": false,
    "runner_name": "akshare-runner",
    "data_mode": "multi",
    "generated_at": "...",
    "source_status": {
      "http_indices": "success",
      "akshare_indices": "success",
      "akshare_breadth": "success",
      "akshare_sectors": "success"
    },
    "data_quality": "fallback",
    "is_fallback": true,
    "warnings": []
  },
  "indices": [],
  "market_breadth": {
    "up_count": null,
    "down_count": null,
    "flat_count": null,
    "limit_up_count": null,
    "limit_down_count": null,
    "total_turnover": null
  },
  "styles": [],
  "sectors": {
    "top_gainers": [],
    "top_losers": []
  },
  "hot_topics": [],
  "capital_flows": [],
  "policy_news": [],
  "risk_signals": []
}
```

## Fallback Briefs

When AkShare or Eastmoney endpoints are completely unavailable, the runner still persists a market brief so the job does not remain `running` or become a technical failure. The generated Markdown states that real market data is unavailable, lists warnings, marks the draft as fallback, and asks for manual review.

Fallback payloads include:

```json
{
  "summary": "真实行情数据源暂不可用，本简报为 fallback 草稿，需人工复核。",
  "tags": ["A股", "市场收评", "fallback", "待复核"],
  "data_sources": ["AkShare", "东方财富接口", "fallback"],
  "generation_status": "needs_review"
}
```

## Current Limits

- No AI generation.
- No DeepSeek / OpenAI calls.
- No news crawling.
- No email sending.
- No Notion sync.
- No cron, GitHub Actions, or n8n.
- No backend PDF generation.
- No stock recommendations, buy/sell signals, or investment advice.

Phase 2L-D-C is only the first real data-source pass. Later phases can add reviewed news sources, AI drafting, scheduling, email, Notion, and richer sector mapping such as GICS.

## Troubleshooting

### Failed to claim market brief generation job

Run diagnose mode first:

```bash
python run_market_brief_runner.py --diagnose
```

Common causes:

1. Vercel has no `MARKET_BRIEF_RUNNER_SECRET`.
2. Local `MARKET_BRIEF_RUNNER_SECRET` does not match Vercel.
3. Vercel env vars were changed but the app was not redeployed.
4. `MARKET_BRIEF_GENERATOR` is not `external`, so the dashboard button did not create a queued job.
5. The dashboard has not yet created a job with `获取今日市场动态`.
6. `SUPABASE_SERVICE_ROLE_KEY` is missing or invalid in the server environment.
7. Local SSL certificates are not configured.

Manual API check:

```bash
curl -i -X POST "$WORKSTATION_BASE_URL/api/market-briefs/skill-jobs/claim" \
  -H "content-type: application/json" \
  -H "x-market-brief-runner-secret: $MARKET_BRIEF_RUNNER_SECRET" \
  -d '{"market":"A股","runner_name":"akshare-runner"}'
```

Interpretation:

- `200 + {"job":null}` or `200` without `job_id`: secret is accepted, but there is no queued job.
- `401`: local runner secret does not match the server secret.
- `503`: Vercel is missing `MARKET_BRIEF_RUNNER_SECRET`, or the app has not been redeployed after env changes.
- `500`: server-side persistence, service role, RLS bypass, or database issue.
- SSL / certificate errors: configure Python certificates, for example:

```bash
export SSL_CERT_FILE=$(python -c "import certifi; print(certifi.where())")
export REQUESTS_CA_BUNDLE=$SSL_CERT_FILE
```

The runner never prints the raw secret. It only prints whether the secret is set, its length, and a short SHA-256 prefix for comparison.
