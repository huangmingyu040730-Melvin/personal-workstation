import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipTone = "blue" | "slate" | "green" | "amber" | "violet";

export type PublicDetailChip = {
  label: string;
  tone?: ChipTone;
};

export type PublicDetailMetaItem = {
  label: string;
  value: React.ReactNode;
};

export type PublicRelatedItem = {
  href: string;
  title: string;
  meta?: string;
  description?: string | null;
  ctaLabel?: string;
};

const chipToneClass: Record<ChipTone, string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700"
};

export function PublicDetailHero({
  eyebrow,
  title,
  description,
  chips = [],
  backHref,
  backLabel
}: {
  eyebrow: string;
  title: string;
  description: string;
  chips?: PublicDetailChip[];
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-55" />
      <div className="pointer-events-none absolute left-[-8%] top-[-30%] -z-10 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-38%] right-[18%] -z-10 h-80 w-80 rounded-full bg-emerald-100/55 blur-3xl" />

      <div className="public-reveal mx-auto max-w-[1680px] px-5 py-12 lg:px-12 lg:py-16 2xl:px-16">
        <Link href={backHref} className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800">
          <ArrowLeft className="transition group-hover:-translate-x-1" size={16} />
          {backLabel}
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
        <h1 className="public-display mt-3 max-w-5xl break-words text-3xl font-semibold leading-tight tracking-normal text-navy-950 md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
        {chips.length > 0 ? (
          <div className="mt-6 flex max-w-4xl flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip.label} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5", chipToneClass[chip.tone ?? "slate"])}>
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={backHref} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
            浏览列表
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PublicDetailBody({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-[1680px] px-5 py-10 lg:px-12 lg:py-12 2xl:px-16">
      {children}
    </section>
  );
}

export function PublicDetailGrid({
  main,
  aside
}: {
  main: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-5">{main}</div>
      <aside className="min-w-0 space-y-5 lg:sticky lg:top-28 lg:self-start">{aside}</aside>
    </div>
  );
}

export function PublicDetailSection({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("public-card-motion rounded-lg border border-slate-200 bg-white/96 p-5 shadow-[0_14px_42px_rgba(15,42,88,0.05)] md:p-6", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-navy-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PublicDetailMetaList({ items }: { items: PublicDetailMetaItem[] }) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[108px_minmax(0,1fr)] gap-3">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="min-w-0 text-right font-medium text-slate-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PublicDetailTags({ tags, emptyLabel = "暂无标签" }: { tags: string[]; emptyLabel?: string }) {
  if (tags.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="max-w-full truncate rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function PublicRelatedContent({
  title,
  description,
  items,
  emptyText,
  browseHref,
  browseLabel
}: {
  title: string;
  description?: string;
  items: PublicRelatedItem[];
  emptyText: string;
  browseHref: string;
  browseLabel: string;
}) {
  return (
    <PublicDetailSection title={title} description={description}>
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="group flex min-h-44 flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-sm">
              {item.meta ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">{item.meta}</p> : null}
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-navy-950">{item.title}</h3>
              {item.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-blue-700">
                {item.ctaLabel ?? "查看"}
                <ArrowRight className="transition group-hover:translate-x-1" size={15} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-500">
          {emptyText}
        </div>
      )}
      <Link href={browseHref} className="group mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
        {browseLabel}
        <ArrowRight className="transition group-hover:translate-x-1" size={15} />
      </Link>
    </PublicDetailSection>
  );
}
