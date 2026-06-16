import Link from "next/link";
import { ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type ListingStat = {
  label: string;
  value: string | number;
};

type FilterOption = {
  href: string;
  label: string;
  active: boolean;
};

export function buildPublicListingHref(path: string, current: Record<string, string>, next: Record<string, string>) {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };

  Object.entries(merged).forEach(([key, value]) => {
    const normalized = value.trim();

    if (normalized && normalized !== "all") {
      params.set(key, normalized);
    }
  });

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function PublicListingHero({
  eyebrow,
  title,
  description,
  stats
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats: ListingStat[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/80 to-white" />
      <div className="absolute inset-0 public-soft-grid opacity-55" />
      <div className="public-reveal relative mx-auto grid max-w-[1680px] gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end lg:px-12 lg:py-14 2xl:px-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-700">{eyebrow}</p>
          <h1 className="public-display mt-3 max-w-5xl text-3xl font-semibold tracking-normal text-navy-950 [overflow-wrap:anywhere] md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 [overflow-wrap:anywhere]">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="public-cta-motion inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <ArrowLeft size={16} />
              返回首页
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-2xl border border-white/80 bg-white/88 p-4 shadow-[0_14px_40px_rgba(15,42,88,0.08)] backdrop-blur">
              <p className="text-2xl font-semibold text-navy-950 [overflow-wrap:anywhere]">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500 [overflow-wrap:anywhere]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PublicListingControls({
  children,
  count,
  active,
  clearHref,
  label
}: {
  children: React.ReactNode;
  count: number;
  active: boolean;
  clearHref: string;
  label: string;
}) {
  return (
    <div className="mb-7 rounded-[28px] border border-slate-200 bg-white/92 p-4 shadow-[0_16px_46px_rgba(15,42,88,0.06)] backdrop-blur">
      {children}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6 [overflow-wrap:anywhere]">
          共找到 <span className="font-semibold text-navy-950">{count}</span> 条{label}
          {active ? "，当前已应用筛选条件" : "，默认按精选优先与更新时间展示"}
        </p>
        {active ? (
          <Link href={clearHref} className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-800">
            清空筛选
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function PublicFilterChipGroup({ label, options }: { label: string; options: FilterOption[] }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Link
            key={`${label}-${option.href}-${option.label}`}
            href={option.href}
            className={cn(
              "max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold leading-5 transition [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              option.active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicListingEmptyState({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_16px_46px_rgba(15,42,88,0.06)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Inbox size={22} />
      </div>
      <p className="mt-4 font-semibold text-navy-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      <Link href={actionHref} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
        {actionLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
