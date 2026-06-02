import type { Status, Visibility } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function statusTone(status: Status) {
  switch (status) {
    case "进行中":
    case "开发中":
    case "in_progress":
    case "developing":
    case "testing":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "可用":
    case "已发布":
    case "available":
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "规划中":
    case "草稿":
    case "planning":
    case "idea":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "archived":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

export function statusLabel(status: Status | string) {
  const labels: Record<string, string> = {
    planning: "规划中",
    in_progress: "进行中",
    completed: "已完成",
    archived: "已归档",
    idea: "构想中",
    developing: "开发中",
    testing: "测试中",
    available: "可用"
  };

  return labels[status] ?? status;
}

export function visibilityLabel(visibility: Visibility) {
  const labels = {
    public: "公开",
    private: "私密",
    unlisted: "链接可见"
  };
  return labels[visibility];
}

export function visibilityTone(visibility: Visibility) {
  const tones = {
    public: "bg-sky-50 text-sky-700 ring-sky-200",
    private: "bg-slate-100 text-slate-700 ring-slate-200",
    unlisted: "bg-indigo-50 text-indigo-700 ring-indigo-200"
  };
  return tones[visibility];
}
