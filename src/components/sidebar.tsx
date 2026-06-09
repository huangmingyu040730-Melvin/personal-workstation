"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { profile, sidebarGroups } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function isSidebarItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/resume") {
    return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith("/dashboard/resume/versions"));
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.18),transparent_32%),linear-gradient(180deg,#07142b_0%,#071126_48%,#061022_100%)] px-3 py-4 text-white shadow-2xl shadow-slate-950/20 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 transition hover:border-white/20 hover:bg-white/[0.09]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-base font-semibold text-navy-950 shadow-sm shadow-blue-950/20">
          {profile.avatarInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">黄铭语工作站</p>
          <p className="mt-0.5 text-[11px] text-blue-100/70">个人数字工作台</p>
        </div>
      </Link>

      <nav className="space-y-4 overflow-y-auto pr-1">
        {sidebarGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isSidebarItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-medium text-blue-100/82 transition duration-200 hover:bg-white/[0.07] hover:text-white",
                      active && "bg-white/[0.12] text-white shadow-sm shadow-blue-950/20 hover:bg-white/[0.14]"
                    )}
                  >
                    <span className={cn("absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-300 opacity-0 transition", active && "opacity-100")} />
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition", active ? "bg-white text-blue-700 shadow-sm" : "bg-white/[0.06] text-blue-100/78 group-hover:bg-white/[0.1] group-hover:text-white")}>
                      <item.icon size={17} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <GraduationCap size={17} />
          研究 · 投资 · AI
        </div>
        <p className="mt-2 text-xs leading-5 text-blue-100/62">统一管理研究项目、内容资产与 AI Skill 工作流。</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.06] px-2.5 py-2 text-[11px] text-blue-100/70">
          <ShieldCheck size={14} />
          后台仅管理员可访问
        </div>
      </div>
    </aside>
  );
}
