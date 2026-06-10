# Python AkShare Market Brief Runner

Phase 2L-D-C adds a first real-data runner for A-share market briefs.

The runner claims queued jobs from the workstation, fetches market data with AkShare, writes a stable `source_snapshot`, generates Markdown, and sends the result back through the existing private API.

It does not need a Supabase key. It only needs the workstation base URL and runner secret.

## Install

```bash
cd scripts/market-brief-runner/python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

```bash
export WORKSTATION_BASE_URL="http://localhost:3000"
export MARKET_BRIEF_RUNNER_SECRET="your_runner_secret"
export MARKET_BRIEF_MARKET="A股"
export MARKET_BRIEF_RUNNER_NAME="akshare-runner"
export MARKET_BRIEF_DATA_MODE="akshare"
```

Defaults:

- `MARKET_BRIEF_MARKET=A股`
- `MARKET_BRIEF_RUNNER_NAME=akshare-runner`
- `MARKET_BRIEF_DATA_MODE=akshare`

Do not commit real secrets. Do not pass Supabase keys to this runner.

## Run

```bash
cd scripts/market-brief-runner/python
python run_market_brief_runner.py
```

Flow:

1. `POST /api/market-briefs/skill-jobs/claim`
2. If no queued job exists, print `No queued market brief generation jobs.` and exit 0.
3. Fetch A-share market data through AkShare.
4. Build `source_snapshot`.
5. Build Markdown.
6. `POST /api/market-briefs/skill-result`
7. Print the returned preview URL.

If the runner claims a job but cannot fetch any core module, it calls:

```text
POST /api/market-briefs/skill-jobs/fail
```

## Data Scope

Current first version attempts to fetch:

- Broad indices: 上证指数、深证成指、创业板指、沪深300、中证500、中证1000、中证2000、中证红利、科创50、北证50
- Market breadth: up/down/flat counts, limit-up/limit-down counts, total turnover
- Sectors: top 10 gainers and top 10 losers from AkShare industry board data
- Hot topics: top industry and concept board directions

Unavailable fields are saved as `null` or empty arrays. Module-level failures are written to `source_snapshot.meta.warnings`.

## Snapshot Shape

```json
{
  "meta": {
    "market": "A股",
    "brief_date": "2026-06-10",
    "runner_name": "akshare-runner",
    "data_mode": "akshare",
    "generated_at": "...",
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
