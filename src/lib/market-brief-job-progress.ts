export type MarketBriefJobProgressStage =
  | "queued"
  | "validating"
  | "preparing"
  | "searching"
  | "analyzing"
  | "writing"
  | "charting"
  | "saving"
  | "succeeded"
  | "failed"
  | "cancelled";

export type MarketBriefJobProgress = {
  stage: MarketBriefJobProgressStage;
  percent: number;
  message: string;
  updated_at: string;
};

export const MARKET_BRIEF_JOB_STALE_AFTER_MS = 5 * 60 * 1000;
export const marketBriefJobStaleMessage = "生成任务长时间未更新，可能已超时。你可以取消任务或重置为排队后重试。";

export type MarketBriefJobProgressStep = {
  stage: MarketBriefJobProgressStage;
  label: string;
  percent: number;
};

export const marketBriefJobWorkflowSteps: MarketBriefJobProgressStep[] = [
  { stage: "queued", label: "任务已创建", percent: 5 },
  { stage: "validating", label: "正在校验交易日与任务参数", percent: 10 },
  { stage: "preparing", label: "正在读取已保存市场素材包", percent: 20 },
  { stage: "analyzing", label: "正在整理素材包来源与事实", percent: 50 },
  { stage: "writing", label: "正在生成市场简报正文", percent: 70 },
  { stage: "charting", label: "正在生成图表数据", percent: 85 },
  { stage: "saving", label: "正在保存简报", percent: 95 }
];

export const marketBriefJobLegacyProgressSteps: MarketBriefJobProgressStep[] = [
  { stage: "searching", label: "历史实时检索阶段", percent: 35 }
];

export const marketBriefJobTerminalOutcomes: MarketBriefJobProgressStep[] = [
  { stage: "succeeded", label: "生成完成", percent: 100 },
  { stage: "failed", label: "生成失败", percent: 100 },
  { stage: "cancelled", label: "任务已取消", percent: 100 }
];

export const marketBriefJobProgressSteps = marketBriefJobWorkflowSteps;

const progressByStage = new Map([
  ...marketBriefJobWorkflowSteps,
  ...marketBriefJobLegacyProgressSteps,
  ...marketBriefJobTerminalOutcomes
].map((step) => [step.stage, step]));

export function createMarketBriefJobProgress(stage: MarketBriefJobProgressStage, message?: string): MarketBriefJobProgress {
  const step = progressByStage.get(stage) ?? progressByStage.get("queued")!;
  return {
    stage,
    percent: step.percent,
    message: message || step.label,
    updated_at: new Date().toISOString()
  };
}

export function getMarketBriefJobProgressFromPayload(payload: Record<string, unknown> | null | undefined, fallbackStage: MarketBriefJobProgressStage = "queued") {
  const progress = isRecord(payload?.progress) ? payload.progress : {};
  const stage = normalizeProgressStage(progress.stage) ?? fallbackStage;
  const fallback = createMarketBriefJobProgress(stage);
  const percent = typeof progress.percent === "number" && Number.isFinite(progress.percent)
    ? Math.max(0, Math.min(100, Math.round(progress.percent)))
    : fallback.percent;

  return {
    stage,
    percent,
    message: typeof progress.message === "string" && progress.message.trim() ? progress.message.trim() : fallback.message,
    updated_at: typeof progress.updated_at === "string" && progress.updated_at.trim() ? progress.updated_at.trim() : fallback.updated_at
  };
}

export function mergeProgressIntoPayload(payload: Record<string, unknown> | null | undefined, progress: MarketBriefJobProgress) {
  return {
    ...(payload ?? {}),
    progress
  };
}

export function normalizeProgressStage(value: unknown): MarketBriefJobProgressStage | null {
  return typeof value === "string" && progressByStage.has(value as MarketBriefJobProgressStage)
    ? value as MarketBriefJobProgressStage
    : null;
}

export function isMarketBriefJobProgressStale(progress: Pick<MarketBriefJobProgress, "updated_at">, now = new Date()) {
  const updatedAt = new Date(progress.updated_at);

  if (Number.isNaN(updatedAt.getTime())) {
    return false;
  }

  return now.getTime() - updatedAt.getTime() > MARKET_BRIEF_JOB_STALE_AFTER_MS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
