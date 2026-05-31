"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { profile, sidebarGroups } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-navy-950 px-4 py-5 text-white lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 rounded-2xl bg-white/8 p-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-lg font-semibold">
          {profile.avatarInitials}
        </div>
        <div>
          <p className="font-semibold">黄铭语工作站</p>
          <p className="text-xs text-blue-100">个人数字工作台</p>
        </div>
      </Link>

      <nav className="space-y-5 overflow-y-auto">
        {sidebarGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-blue-200/80">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white",
                      active && "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/8 p-4">
        <div className="flex items-center gap-3 text-sm font-medium">
          <GraduationCap size={18} />
          研究 · 投资 · AI
        </div>
        <p className="mt-2 text-xs leading-5 text-blue-100/80">为研究项目、知识沉淀和 AI Skill 工作流建立统一入口。</p>
      </div>
    </aside>
  );
}
