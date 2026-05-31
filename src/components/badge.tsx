import type { Status, Visibility } from "@/lib/types";
import { cn, statusTone, visibilityLabel, visibilityTone } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={statusTone(status)}>{status}</Badge>;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return <Badge className={visibilityTone(visibility)}>{visibilityLabel(visibility)}</Badge>;
}
