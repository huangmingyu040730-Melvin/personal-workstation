import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
};

export function PageHeader({ eyebrow, title, description, action, compact = false }: PageHeaderProps) {
  return (
    <div className={cn("admin-reveal border border-slate-200 bg-white shadow-soft", compact ? "rounded-lg p-4" : "mb-6 rounded-3xl p-5")}>
      <div className={cn("flex flex-col justify-between gap-4 lg:flex-row", compact ? "lg:items-center" : "lg:items-end")}>
      <div>
        {eyebrow ? (
          <Badge className={cn("bg-blue-50 text-blue-700 ring-blue-200", compact ? "mb-2" : "mb-3")}>{eyebrow}</Badge>
        ) : null}
        <h1 className={cn("font-semibold tracking-normal text-slate-950", compact ? "text-2xl" : "text-3xl")}>{title}</h1>
        <p className={cn("max-w-3xl text-sm leading-6 text-slate-600", compact ? "mt-1" : "mt-2")}>{description}</p>
      </div>
      {action}
      </div>
    </div>
  );
}
