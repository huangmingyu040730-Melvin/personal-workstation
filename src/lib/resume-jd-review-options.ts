import type { ResumeJdReviewStatus } from "@/lib/content-types";

export const resumeJdReviewStatusOptions: Array<{ value: ResumeJdReviewStatus; label: string; tone: string }> = [
  { value: "draft", label: "草稿", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
  { value: "reviewed", label: "已分析", tone: "bg-blue-50 text-blue-700 ring-blue-100" },
  { value: "ready", label: "准备投递", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  { value: "submitted", label: "已投递", tone: "bg-violet-50 text-violet-700 ring-violet-100" },
  { value: "interview", label: "面试中", tone: "bg-amber-50 text-amber-700 ring-amber-100" },
  { value: "rejected", label: "被拒", tone: "bg-rose-50 text-rose-700 ring-rose-100" },
  { value: "offer", label: "Offer", tone: "bg-green-50 text-green-700 ring-green-100" },
  { value: "archived", label: "已归档", tone: "bg-slate-100 text-slate-500 ring-slate-200" }
];

export function getResumeJdReviewStatusLabel(status: string) {
  return resumeJdReviewStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function getResumeJdReviewStatusTone(status: string) {
  return resumeJdReviewStatusOptions.find((option) => option.value === status)?.tone ?? "bg-slate-100 text-slate-600 ring-slate-200";
}
