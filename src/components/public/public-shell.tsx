import Link from "next/link";
import { profile } from "@/lib/mock-data";

const navItems = [
  { label: "首页", href: "/" },
  { label: "研究项目", href: "/projects" },
  { label: "学术成果", href: "/publications" },
  { label: "知识库", href: "/knowledge" },
  { label: "Skill 库", href: "/skills" },
  { label: "访问申请", href: "/access-request" }
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-navy-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/[.92] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-12 2xl:px-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-950 text-sm font-semibold text-white shadow-sm">
              {profile.avatarInitials}
            </div>
            <div>
              <p className="font-semibold text-navy-950">黄铭语研究工作站</p>
              <p className="text-xs text-slate-500">公开研究 · 学术成果 · AI Skill</p>
            </div>
          </Link>
          <nav className="flex max-w-full flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-5 py-9 text-sm text-slate-500 md:flex-row md:items-center md:justify-between lg:px-12 2xl:px-16">
          <p>黄铭语公开研究工作站 · 仅展示明确设为 public 的研究内容</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects" className="font-medium text-slate-600 hover:text-blue-700">研究项目</Link>
            <Link href="/publications" className="font-medium text-slate-600 hover:text-blue-700">学术成果</Link>
            <Link href="/knowledge" className="font-medium text-slate-600 hover:text-blue-700">知识库</Link>
            <Link href="/skills" className="font-medium text-slate-600 hover:text-blue-700">Skill 库</Link>
            <Link href="/about" className="font-medium text-slate-600 hover:text-blue-700">关于我</Link>
            <Link href="/access-request" className="font-medium text-slate-600 hover:text-blue-700">访问申请</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function PublicPageHero({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="public-reveal mx-auto max-w-[1680px] px-5 py-12 lg:px-12 2xl:px-16">
        <p className="text-sm font-semibold uppercase text-blue-700">{eyebrow}</p>
        <h1 className="public-display mt-3 max-w-5xl text-3xl font-semibold tracking-normal text-navy-950 md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
      </div>
    </section>
  );
}

export function PublicEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-soft">
      <p className="font-semibold text-navy-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function PublicSectionHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold uppercase text-blue-700">{eyebrow}</p> : null}
        <h2 className="public-display mt-1 text-2xl font-semibold tracking-normal text-navy-950">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PublicListToolbar({
  count,
  active,
  clearHref,
  label = "公开内容"
}: {
  count: number;
  active: boolean;
  clearHref: string;
  label?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <p className="leading-6">
        共找到 <span className="font-semibold text-navy-950">{count}</span> 条{label}
        {active ? "，当前已应用筛选条件" : "，默认按精选优先与更新时间展示"}
      </p>
      {active ? (
        <Link href={clearHref} className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-800">
          清空筛选
        </Link>
      ) : null}
    </div>
  );
}
