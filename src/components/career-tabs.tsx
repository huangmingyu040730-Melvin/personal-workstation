import Link from "next/link";

type CareerTabKey = "center" | "items" | "versions" | "applications" | "jdReviews";

const careerTabs: Array<{ label: string; href: string; key: CareerTabKey }> = [
  { label: "求职中心", href: "/dashboard/career", key: "center" },
  { label: "简历素材", href: "/dashboard/resume", key: "items" },
  { label: "简历版本", href: "/dashboard/resume/versions", key: "versions" },
  { label: "投递看板", href: "/dashboard/resume/applications", key: "applications" },
  { label: "JD 分析记录", href: "/dashboard/resume/jd-reviews", key: "jdReviews" }
];

export function CareerTabs({ active }: { active: CareerTabKey }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-soft">
      {careerTabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={
            active === tab.key
              ? "rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
