"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Play, RotateCcw, XCircle } from "lucide-react";
import type { MarketBriefJobProgress } from "@/lib/market-brief-job-progress";
import { marketBriefJobProgressSteps } from "@/lib/market-brief-job-progress";

type MarketBriefJobProgressStatus = {
  id: string;
  status: string;
  progress: MarketBriefJobProgress;
  error_message: string | null;
  market_brief_id: string | null;
  preview_url: string | null;
  stale?: boolean;
  stale_message?: string | null;
};

export function MarketBriefJobProgressPanel({
  jobId,
  autoGenerate,
  initialStatus,
  initialProgress,
  initialPreviewUrl,
  initialErrorMessage
}: {
  jobId: string;
  autoGenerate: boolean;
  initialStatus: string;
  initialProgress: MarketBriefJobProgress;
  initialPreviewUrl?: string | null;
  initialErrorMessage?: string | null;
}) {
  const router = useRouter();
  const generateStartedRef = useRef(false);
  const redirectStartedRef = useRef(false);
  const [jobStatus, setJobStatus] = useState<MarketBriefJobProgressStatus>({
    id: jobId,
    status: initialStatus,
    progress: initialProgress,
    error_message: initialErrorMessage ?? null,
    market_brief_id: null,
    preview_url: initialPreviewUrl ?? null,
    stale: false,
    stale_message: null
  });
  const [requestState, setRequestState] = useState<"idle" | "starting" | "polling" | "error">("idle");
  const [requestError, setRequestError] = useState<string | null>(null);

  const terminalState = jobStatus.status === "succeeded" || jobStatus.status === "failed" || jobStatus.status === "cancelled";
  const canStart = (jobStatus.status === "queued" || jobStatus.status === "running") && !jobStatus.stale;

  const refreshStatus = useCallback(async () => {
    const response = await fetch(`/api/market-briefs/jobs/${jobId}/status`, {
      method: "GET",
      cache: "no-store"
    });
    const payload = await response.json().catch(() => null) as MarketBriefJobProgressStatus | { error?: string } | null;

    if (!response.ok || !isJobStatusPayload(payload)) {
      throw new Error(payload && "error" in payload && payload.error ? payload.error : "读取任务状态失败。");
    }

    setJobStatus(payload);
    return payload;
  }, [jobId]);

  const startGeneration = useCallback(async () => {
    if (!canStart || generateStartedRef.current) return;
    generateStartedRef.current = true;
    setRequestState("starting");
    setRequestError(null);

    try {
      const response = await fetch(`/api/market-briefs/jobs/${jobId}/generate-ai`, {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const payload = await response.json().catch(() => null) as MarketBriefJobProgressStatus | { error?: string; progress?: MarketBriefJobProgress } | null;

      if (isJobStatusPayload(payload)) {
        setJobStatus(payload);
      }

      if (!response.ok && response.status !== 202) {
        throw new Error(getPayloadError(payload) ?? (isJobStatusPayload(payload) && payload.stale ? "生成任务长时间未更新，可能已超时。" : "AI 市场简报生成启动失败。"));
      }

      setRequestState("polling");
      await refreshStatus();
    } catch (error) {
      setRequestState("error");
      setRequestError(error instanceof Error && error.message.trim() ? error.message : "AI 市场简报生成启动失败。");
      generateStartedRef.current = false;
    }
  }, [canStart, jobId, refreshStatus]);

  useEffect(() => {
    if (autoGenerate && canStart && !generateStartedRef.current) {
      void startGeneration();
    }
  }, [autoGenerate, canStart, startGeneration]);

  useEffect(() => {
    if (terminalState) return;

    const interval = window.setInterval(() => {
      void refreshStatus().catch((error) => {
        setRequestState("error");
        setRequestError(error instanceof Error ? error.message : "读取任务状态失败。");
      });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [refreshStatus, terminalState]);

  useEffect(() => {
    if (jobStatus.status !== "succeeded" || !jobStatus.preview_url || redirectStartedRef.current) return;
    redirectStartedRef.current = true;
    const timeout = window.setTimeout(() => {
      router.push(jobStatus.preview_url!);
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [jobStatus.preview_url, jobStatus.status, router]);

  const currentStepIndex = useMemo(
    () => marketBriefJobProgressSteps.findIndex((step) => step.stage === jobStatus.progress.stage),
    [jobStatus.progress.stage]
  );

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">AI Generation Progress</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{getPanelTitle(jobStatus.status)}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{getPanelDescription(jobStatus.status, requestState)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {jobStatus.status === "queued" && !autoGenerate ? (
            <button
              type="button"
              onClick={() => void startGeneration()}
              disabled={requestState === "starting"}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {requestState === "starting" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              开始生成
            </button>
          ) : null}
          {jobStatus.status === "failed" ? (
            <a href="#job-management-actions" className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-100">
              <RotateCcw size={16} />
              重新排队
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-800">{jobStatus.progress.message}</p>
          <span className="text-sm font-semibold tabular-nums text-blue-700">{jobStatus.progress.percent}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProgressBarClassName(jobStatus.status)}`}
            style={{ width: `${jobStatus.progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">更新时间：{formatProgressTime(jobStatus.progress.updated_at)}</p>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {marketBriefJobProgressSteps.map((step, index) => (
          <div
            key={step.stage}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${getStepClassName(jobStatus.progress.stage, index, currentStepIndex, jobStatus.status)}`}
          >
            {getStepIcon(jobStatus.progress.stage, step.stage, index, currentStepIndex, jobStatus.status)}
            <span className="font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      {jobStatus.status === "succeeded" && jobStatus.preview_url ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          生成完成，正在跳转预览页。
        </div>
      ) : null}

      {jobStatus.status === "failed" ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          生成失败：{jobStatus.error_message ?? requestError ?? "请查看错误信息后重新排队。"}
        </div>
      ) : null}

      {jobStatus.status === "cancelled" ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          任务已取消，页面已停止轮询。
        </div>
      ) : null}

      {jobStatus.stale ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
          {jobStatus.stale_message ?? "生成任务长时间未更新，可能已超时。为避免重复消耗额度，请先重置为排队后再重新生成。"}
          <div className="mt-1 font-semibold">为避免重复消耗额度，请先取消任务或重置为排队后再重新生成。</div>
        </div>
      ) : null}

      {requestError && jobStatus.status !== "failed" && !jobStatus.stale ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
          {requestError}
        </div>
      ) : null}
    </section>
  );
}

function getPanelTitle(status: string) {
  if (status === "succeeded") return "市场简报已生成";
  if (status === "failed") return "AI 生成失败";
  if (status === "cancelled") return "任务已取消";
  return "AI 正在生成市场简报";
}

function getPanelDescription(status: string, requestState: string) {
  if (status === "succeeded") return "简报已保存，稍后会自动进入预览页。";
  if (status === "failed") return "可在右侧任务操作中重新排队，再次启动生成。";
  if (status === "cancelled") return "该任务不会继续生成，可重新排队后再次启动。";
  if (requestState === "starting") return "正在启动 AI 生成流程，页面会自动刷新进度。";
  return "页面会持续轮询任务状态，生成完成后自动跳转到预览页。";
}

function getProgressBarClassName(status: string) {
  if (status === "failed") return "bg-rose-500";
  if (status === "cancelled") return "bg-slate-400";
  if (status === "succeeded") return "bg-emerald-500";
  return "bg-blue-600";
}

function getStepClassName(
  currentStage: string,
  index: number,
  currentIndex: number,
  status: string
) {
  if (currentStage === "failed" && marketBriefJobProgressSteps[index].stage === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (currentStage === "cancelled" && marketBriefJobProgressSteps[index].stage === "cancelled") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "succeeded" || index < currentIndex) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (index === currentIndex) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-100 bg-slate-50 text-slate-500";
}

function getStepIcon(
  currentStage: string,
  stepStage: string,
  index: number,
  currentIndex: number,
  status: string
) {
  if (stepStage === "failed" && currentStage === "failed") return <XCircle size={14} className="shrink-0" />;
  if (stepStage === "cancelled" && currentStage === "cancelled") return <XCircle size={14} className="shrink-0" />;
  if (status === "succeeded" || index < currentIndex) return <CheckCircle2 size={14} className="shrink-0" />;
  if (index === currentIndex && status !== "failed" && status !== "cancelled") return <Loader2 size={14} className="shrink-0 animate-spin" />;
  return <Circle size={14} className="shrink-0" />;
}

function formatProgressTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function isJobStatusPayload(value: unknown): value is MarketBriefJobProgressStatus {
  return typeof value === "object" && value !== null && "progress" in value && isProgressPayload((value as { progress?: unknown }).progress);
}

function isProgressPayload(value: unknown): value is MarketBriefJobProgress {
  return typeof value === "object" && value !== null
    && typeof (value as { stage?: unknown }).stage === "string"
    && typeof (value as { percent?: unknown }).percent === "number"
    && typeof (value as { message?: unknown }).message === "string"
    && typeof (value as { updated_at?: unknown }).updated_at === "string";
}

function getPayloadError(value: unknown) {
  return typeof value === "object" && value !== null && "error" in value && typeof (value as { error?: unknown }).error === "string"
    ? (value as { error: string }).error
    : null;
}
