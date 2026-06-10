# Market Brief External Runner

This folder contains a minimal external runner skeleton for Phase 2L-D-B.

The runner communicates only through private workstation API endpoints. It does not need a Supabase key.

## Environment

```bash
export WORKSTATION_BASE_URL="http://localhost:3000"
export MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
export MARKET_BRIEF_MARKET="A股"
export MARKET_BRIEF_RUNNER_NAME="external-skill-runner"
```

`MARKET_BRIEF_RUNNER_SECRET` must match the server-side `MARKET_BRIEF_RUNNER_SECRET` configured on the workstation app. Do not commit real secrets.

## Run

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

## Current Scope

- Uses mock data only.
- Does not call AkShare, Tushare, Wind, news crawlers, AI, email, Notion, cron, GitHub Actions, or n8n.
- Does not provide investment advice or stock recommendations.

Phase 2L-D-C can replace the mock generation block with real data collection and reviewed markdown generation.
