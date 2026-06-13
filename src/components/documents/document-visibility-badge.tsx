import { LockKeyhole } from "lucide-react";
import type { Visibility } from "@/lib/types";
import { cn, visibilityLabel } from "@/lib/utils";

export function DocumentVisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className={cn(
      "inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs font-medium",
      visibility === "private"
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : "border-blue-100 bg-blue-50 text-blue-700"
    )}>
      {visibility === "private" ? <LockKeyhole size={12} aria-hidden="true" /> : null}
      {visibilityLabel(visibility)}
    </span>
  );
}
