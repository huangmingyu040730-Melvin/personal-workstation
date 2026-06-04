import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { profile } from "@/lib/mock-data";

const navItems = [
  { label: "项目", href: "/projects" },
  { label: "成果", href: "/publications" },
  { label: "Skill", href: "/skills" },
  { label: "知识", href: "/knowledge" }
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95">
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
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              管理员登录
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>
      {children}
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
