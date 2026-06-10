# Market Brief External Runner

This folder contains external runner examples for Market Brief generation.

The runner communicates only through private workstation API endpoints. It does not need a Supabase key.

Available runners:

- `run-market-brief-runner.mjs`: Node.js mock runner for API flow testing.
- `python/run_market_brief_runner.py`: Python AkShare runner for first-version real A-share market data.

## Environment

```bash
export WORKSTATION_BASE_URL="http://localhost:3000"
export MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
export MARKET_BRIEF_MARKET="A股"
export MARKET_BRIEF_RUNNER_NAME="external-skill-runner"
```

`MARKET_BRIEF_RUNNER_SECRET` must match the server-side `MARKET_BRIEF_RUNNER_SECRET` configured on the workstation app. Do not commit real secrets.

## Run Node Mock Runner

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

## Run Python AkShare Runner

```bash
cd scripts/market-brief-runner/python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export WORKSTATION_BASE_URL="http://localhost:3000"
export MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
export MARKET_BRIEF_RUNNER_NAME="akshare-runner"
export MARKET_BRIEF_DATA_MODE="akshare"
python run_market_brief_runner.py
```

The Python runner attempts to fetch broad A-share indices, market breadth, industry boards, and hot-topic placeholders from AkShare. If a module fails, it records warnings in `source_snapshot.meta.warnings`. If no core data is available after a job is claimed, it marks the job failed.

## Current Scope

- Node runner uses mock data only.
- Python runner uses AkShare for first-version real market data.
- Does not call Tushare, Wind, news crawlers, AI, email, Notion, cron, GitHub Actions, or n8n.
- Does not provide investment advice or stock recommendations.

Later phases can add reviewed news sources, AI drafting, scheduled execution, richer sector mapping, email delivery, and Notion sync.
