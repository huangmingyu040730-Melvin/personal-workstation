import Link from "next/link";
import { BriefcaseBusiness, FileSearch, FileUser, LayoutDashboard, Layers3 } from "lucide-react";

type CareerTabKey = "center" | "items" | "versions" | "applications" | "jdReviews";

const careerTabs: Array<{ label: string; shortLabel: string; href: string; key: CareerTabKey; icon: typeof LayoutDashboard; step?: number }> = [
  { label: "求职总览", shortLabel: "总览", href: "/dashboard/career", key: "center", icon: LayoutDashboard },
  { label: "简历素材", shortLabel: "素材", href: "/dashboard/resume", key: "items", icon: FileUser, step: 1 },
  { label: "简历版本", shortLabel: "版本", href: "/dashboard/resume/versions", key: "versions", icon: Layers3, step: 2 },
  { label: "JD 分析", shortLabel: "JD", href: "/dashboard/resume/jd-reviews", key: "jdReviews", icon: FileSearch, step: 3 },
  { label: "投递看板", shortLabel: "投递", href: "/dashboard/resume/applications", key: "applications", icon: BriefcaseBusiness, step: 4 }
];

export function CareerTabs({ active }: { active: CareerTabKey }) {
  return (
    <nav aria-label="求职中心导航" className="overflow-x-auto border-y border-slate-200 bg-white/80 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center">
        {careerTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex h-12 items-center gap-2 border-b-2 border-blue-600 px-3 text-sm font-semibold text-blue-700 sm:px-4"
                  : "flex h-12 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900 sm:px-4"
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.step ? <span className={isActive ? "hidden text-xs text-blue-500 sm:inline" : "hidden text-xs text-slate-400 sm:inline"}>0{tab.step}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
