import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { profile } from "@/lib/mock-data";

const navItems = [
  { label: "首页", href: "/" },
  { label: "研究项目", href: "/projects" },
  { label: "学术成果", href: "/publications" },
  { label: "Skill 库", href: "/skills" },
  { label: "知识文章", href: "/knowledge" },
  { label: "关于我", href: "/about" },
  { label: "访问申请", href: "/access-request" }
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-900 text-sm font-semibold text-white">
              {profile.avatarInitials}
            </div>
            <div>
              <p className="font-semibold text-slate-950">黄铭语研究工作站</p>
              <p className="text-xs text-slate-500">公开研究 · 学术成果 · AI Skill</p>
            </div>
          </Link>
          <nav className="flex max-w-full flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              管理员登录
              <ArrowRight size={15} />
            </Link>
            <Link href="/viewer/login" className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              授权登录
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>黄铭语公开研究工作站 · 仅展示明确设为 public 的内容</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/about" className="font-medium text-slate-600 hover:text-blue-700">关于我</Link>
            <Link href="/access-request" className="font-medium text-slate-600 hover:text-blue-700">申请查看受限内容</Link>
            <Link href="/viewer/login" className="font-medium text-slate-600 hover:text-blue-700">授权访问登录</Link>
            <Link href="/login" className="font-medium text-slate-600 hover:text-blue-700">管理员登录</Link>
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
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
      </div>
    </section>
  );
}

export function PublicEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
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
        {eyebrow ? <p className="text-sm font-semibold text-blue-700">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PublicListToolbar({
  count,
  active,
  clearHref
}: {
  count: number;
  active: boolean;
  clearHref: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        共找到 <span className="font-semibold text-slate-900">{count}</span> 条公开内容
        {active ? "，当前已应用筛选" : "，按精选优先与时间倒序展示"}
      </p>
      {active ? (
        <Link href={clearHref} className="font-semibold text-blue-700 hover:text-blue-900">
          清空筛选
        </Link>
      ) : null}
    </div>
  );
}
