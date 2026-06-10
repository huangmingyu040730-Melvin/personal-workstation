# Deprecated Market Brief External Runner

> Deprecated: Market Brief generation is now AI-first in the web app. This folder remains only for historical diagnostics and compatibility tests. It is not the recommended generation path.

This folder contains deprecated external runner examples for Market Brief generation.

The runner communicates only through private workstation API endpoints. It does not need a Supabase key.

Recommended current setup is the AI-first web app path:

```bash
MARKET_BRIEF_GENERATOR=ai
AI_PROVIDER=deepseek
AI_API_KEY="your_api_key"
AI_BASE_URL="https://api.deepseek.com"
AI_MODEL="deepseek-v4-flash"
```

Legacy runners kept here for diagnostics:

- `run-market-brief-runner.mjs`: Node.js mock runner for API flow testing.
- `python/run_market_brief_runner.py`: Python AkShare runner for first-version real A-share market data.

## Legacy Environment

```bash
export WORKSTATION_BASE_URL="http://localhost:3000"
export MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
export MARKET_BRIEF_MARKET="A股"
export MARKET_BRIEF_RUNNER_NAME="external-skill-runner"
```

`MARKET_BRIEF_RUNNER_SECRET` must match the server-side `MARKET_BRIEF_RUNNER_SECRET` configured on the workstation app. Do not commit real secrets.

## Run Node Mock Runner For Legacy Diagnostics

```bash
node scripts/market-brief-runner/run-market-brief-runner.mjs
```

Flow:

1. POST `/api/market-briefs/skill-jobs/claim`
2. If no queued job exists, print `No queued market brief generation jobs.`
3. If a job is claimed, generate mock Markdown.
4. POST `/api/market-briefs/skill-result`
5. Print the returned preview URL.

If generation fails, the script calls:

```text
POST /api/market-briefs/skill-jobs/fail
```

## Run Deprecated Python Data Runner

```bash
cd scripts/market-brief-runner/python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export WORKSTATION_BASE_URL="http://localhost:3000"
export MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
export MARKET_BRIEF_RUNNER_NAME="akshare-runner"
export MARKET_BRIEF_DATA_MODE="multi"
python run_market_brief_runner.py
```

The Python runner defaults to `MARKET_BRIEF_DATA_MODE=multi`, tries a lightweight HTTP index source before AkShare, and records module status in `source_snapshot.meta.source_status`. For historical jobs it uses `job.brief_date`, skips latest-only sources instead of substituting today data, and writes a partial or fallback Markdown brief with `generation_status=needs_review` when data is incomplete.

## Current Scope

- Node runner uses mock data only.
- Python runner uses AkShare for first-version real market data.
- Does not call Tushare, Wind, news crawlers, AI, email, Notion, cron, GitHub Actions, or n8n.
- Does not provide investment advice or stock recommendations.

Later phases can add reviewed news sources, AI drafting, scheduled execution, richer sector mapping, email delivery, and Notion sync.
