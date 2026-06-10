# Deprecated Python Market Brief Runner

Market Brief generation is now AI-first and runs inside the web app server action.

This Python runner is kept only for historical diagnostics and compatibility checks. It is no longer the recommended path for generating market briefs.

Use the server-side AI configuration instead:

```text
MARKET_BRIEF_GENERATOR=ai
AI_PROVIDER=deepseek
AI_API_KEY=...
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=...
```

Deprecated legacy settings:

```text
MARKET_BRIEF_GENERATOR=external
MARKET_BRIEF_RUNNER_SECRET=...
MARKET_BRIEF_DATA_MODE=...
```
