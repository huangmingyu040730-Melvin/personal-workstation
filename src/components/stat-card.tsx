import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}
