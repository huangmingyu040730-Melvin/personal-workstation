import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

export function DashboardRouteSkeleton({
  eyebrow = "Workspace",
  title = "正在加载内容",
  variant = "cards"
}: {
  eyebrow?: string;
  title?: string;
  variant?: "cards" | "list" | "detail" | "dashboard";
}) {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 h-5 w-28 animate-pulse rounded-full bg-blue-100" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
            <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
          </div>
          <SkeletonBlock className="h-11 w-32" />
        </div>
      </div>

      {variant === "dashboard" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="mt-4 h-8 w-24" />
                <SkeletonBlock className="mt-3 h-3 w-32" />
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <SkeletonBlock className="h-5 w-32" />
                <div className="mt-5 space-y-3">
                  <SkeletonBlock className="h-12 w-full" />
                  <SkeletonBlock className="h-12 w-full" />
                  <SkeletonBlock className="h-12 w-4/5" />
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {variant === "cards" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-5 w-3/4" />
                  <SkeletonBlock className="mt-3 h-4 w-full" />
                  <SkeletonBlock className="mt-2 h-4 w-5/6" />
                </div>
                <SkeletonBlock className="h-7 w-16 rounded-full" />
              </div>
              <SkeletonBlock className="mt-6 h-3 w-full" />
              <SkeletonBlock className="mt-5 h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : null}

      {variant === "list" ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-4">
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="mt-3 h-4 w-full" />
                <SkeletonBlock className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {variant === "detail" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.4fr]">
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="mt-5 h-4 w-full" />
                <SkeletonBlock className="mt-3 h-4 w-11/12" />
                <SkeletonBlock className="mt-3 h-4 w-2/3" />
              </Card>
            ))}
          </div>
          <Card>
            <SkeletonBlock className="h-5 w-24" />
            <div className="mt-5 space-y-3">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-3/4" />
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
