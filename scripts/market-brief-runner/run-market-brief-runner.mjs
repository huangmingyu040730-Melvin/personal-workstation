#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(process.env.WORKSTATION_BASE_URL);
const runnerSecret = process.env.MARKET_BRIEF_RUNNER_SECRET;
const market = process.env.MARKET_BRIEF_MARKET || "A股";
const runnerName = process.env.MARKET_BRIEF_RUNNER_NAME || "external-skill-runner";

if (!baseUrl) {
  console.error("WORKSTATION_BASE_URL is required, for example http://localhost:3000");
  process.exit(1);
}

if (!runnerSecret) {
  console.error("MARKET_BRIEF_RUNNER_SECRET is required.");
  process.exit(1);
}

const claim = await postJson("/api/market-briefs/skill-jobs/claim", {
  market,
  runner_name: runnerName
});

if (!claim.job_id) {
  console.log(claim.message || "No queued market brief generation jobs.");
  process.exit(0);
}

console.log(`Claimed market brief job ${claim.job_id} for ${claim.market} ${claim.brief_date}.`);

try {
  const generated = buildMockMarketBrief(claim);
  const result = await postJson("/api/market-briefs/skill-result", generated);
  console.log(`Market brief generated: ${result.preview_url}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "External runner failed.";
  await postJson("/api/market-briefs/skill-jobs/fail", {
    job_id: claim.job_id,
    error_message: message
  }).catch(() => null);
  console.error(message);
  process.exit(1);
}

async function postJson(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-market-brief-runner-secret": runnerSecret
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return body;
}

function buildMockMarketBrief(job) {
  const generatedAt = new Date().toISOString();
  const title = `${job.market}市场收评简报｜${job.brief_date}`;
  const summary = "本简报由外部 runner 骨架生成，当前仍使用 mock 数据，用于验证 claim -> result 回写链路。";

  return {
    job_id: job.job_id,
    brief_date: job.brief_date,
    market: job.market,
    title,
    summary,
    markdown_content: [
      `# ${title}`,
      "",
      "> 本简报由 external-skill-runner 骨架生成，当前尚未接入真实行情、新闻源或 AI。",
      "",
      `- 日期：${job.brief_date}`,
      `- 市场：${job.market}`,
      "- 生成方式：external-skill-runner",
      "",
      "## 一、摘要",
      "",
      summary,
      "",
      "## 二、市场概览",
      "",
      "外部 runner 已完成任务领取和回写流程。本段为占位内容，后续 Phase 2L-D-C 可替换为真实行情与新闻摘要。",
      "",
      "## 三、指数表现",
      "",
      "指数表现为 mock 数据，未接入 AkShare、Tushare 或 Wind。",
      "",
      "## 四、风险提示",
      "",
      "本内容仅用于系统联调，不构成投资建议。",
      "",
      "## 数据来源",
      "",
      "- External runner mock fixture",
      "- 当前尚未接入真实行情、新闻或 AI 数据源",
      ""
    ].join("\n"),
    source_snapshot: {
      meta: {
        market: job.market,
        brief_date: job.brief_date,
        runner_name: runnerName,
        generated_at: generatedAt,
        mode: "external_mock",
        data_quality: "mock_only"
      },
      indices: [{ name: "上证指数", code: "000001.SH", close: null, change_pct: null, turnover: null }],
      styles: [],
      sectors: [],
      hot_topics: [],
      capital_flows: [],
      policy_news: [],
      risk_signals: []
    },
    tags: ["市场简报", job.market, "external-runner", "mock", "待复核"],
    data_sources: ["External runner mock fixture", "未接入真实行情数据"]
  };
}

function normalizeBaseUrl(value) {
  if (!value) return null;
  return value.replace(/\/+$/, "");
}
