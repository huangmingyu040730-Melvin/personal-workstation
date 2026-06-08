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

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 bg-navy-950 px-4 py-5 text-white shadow-2xl shadow-slate-950/20 lg:flex">
      <Link href="/" className="mb-7 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/8 p-3 transition hover:bg-white/12">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-navy-950">
          {profile.avatarInitials}
        </div>
        <div>
          <p className="font-semibold">黄铭语工作站</p>
          <p className="text-xs text-blue-100">个人数字工作台</p>
        </div>
      </Link>

      <nav className="space-y-5 overflow-y-auto pr-1">
        {sidebarGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200/70">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isSidebarItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-blue-100 transition duration-200 hover:translate-x-1 hover:bg-white/10 hover:text-white",
                      active && "bg-white text-navy-950 shadow-lg shadow-blue-950/30 hover:bg-white hover:text-navy-950"
                    )}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition", active ? "bg-blue-50 text-blue-700" : "bg-white/8 text-blue-100 group-hover:bg-white/12")}>
                      <item.icon size={17} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/8 p-4">
        <div className="flex items-center gap-3 text-sm font-medium">
          <GraduationCap size={18} />
          研究 · 投资 · AI
        </div>
        <p className="mt-2 text-xs leading-5 text-blue-100/80">为研究项目、知识沉淀和 AI Skill 工作流建立统一入口。</p>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-xs text-blue-100/80">
          <ShieldCheck size={14} />
          后台仅管理员可访问
        </div>
      </div>
    </aside>
  );
}
