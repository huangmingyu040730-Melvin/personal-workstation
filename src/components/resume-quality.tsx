import { AlertTriangle, CheckCircle2, Lightbulb, Target } from "lucide-react";
import { Badge } from "@/components/badge";
import { Progress } from "@/components/progress";
import type { ResumeQualityReport } from "@/lib/resume-quality";
import { resumeQualityStatusMeta } from "@/lib/resume-quality";
import { cn } from "@/lib/utils";

export function ResumeQualityBadge({ report }: { report: ResumeQualityReport }) {
  const meta = resumeQualityStatusMeta[report.status];
  return <Badge className={meta.toneClass}>{report.score}% · {meta.label}</Badge>;
}

export function ResumeQualitySummary({ report, compact = false }: { report: ResumeQualityReport; compact?: boolean }) {
  const meta = resumeQualityStatusMeta[report.status];

  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-soft", compact && "p-4")}> 
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">简历质量检查</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{meta.description}</p>
        </div>
        <ResumeQualityBadge report={report} />
      </div>
      <div className="mt-4 flex items-end gap-4">
        <div className="min-w-20">
          <p className="text-3xl font-semibold text-slate-950">{report.score}%</p>
          <p className="text-xs text-slate-500">完整度</p>
        </div>
        <div className="flex-1 pb-3">
          <Progress value={report.score} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>{report.metrics.visibleItemCount} 条展示素材</span>
        <span>{report.metrics.bulletCount} 条 bullet</span>
        <span>{report.metrics.quantifiedBulletCount} 条量化表达</span>
      </div>
    </div>
  );
}

export function ResumeQualityPanel({ report }: { report: ResumeQualityReport }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <ResumeQualitySummary report={report} compact />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <QualityList title="已完成" icon={<CheckCircle2 size={17} />} items={report.passed} emptyText="还没有明显通过项。" tone="emerald" />
        <QualityList title="风险项" icon={<AlertTriangle size={17} />} items={report.warnings} emptyText="暂未发现明显风险。" tone="amber" />
        <QualityList title="建议项" icon={<Lightbulb size={17} />} items={report.suggestions} emptyText="暂无额外建议。" tone="blue" />
      </div>
    </section>
  );
}

export function ResumeQualityPreviewNotice({ report }: { report: ResumeQualityReport }) {
  const hasBlockingWarning = report.status === "incomplete" || report.warnings.length > 0;

  return (
    <div className={cn("rounded-3xl border p-4 text-sm shadow-soft", hasBlockingWarning ? "border-amber-100 bg-amber-50 text-amber-800" : "border-emerald-100 bg-emerald-50 text-emerald-800")}> 
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">打印前检查：{report.score}% · {resumeQualityStatusMeta[report.status].label}</p>
            <p className="mt-1 leading-6">
              {hasBlockingWarning ? report.warnings[0] ?? "仍有投递前建议补充的信息。" : "核心信息较完整，适合进入打印预览。"}
            </p>
          </div>
        </div>
        <ResumeQualityBadge report={report} />
      </div>
    </div>
  );
}

function QualityList({ title, icon, items, emptyText, tone }: { title: string; icon: React.ReactNode; items: string[]; emptyText: string; tone: "emerald" | "amber" | "blue" }) {
  const toneClass = {
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    blue: "text-blue-700 bg-blue-50"
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", toneClass)}>{icon}</span>
        {title}
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {items.slice(0, 6).map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}
