import { Bell, LogOut, Moon, Plus, Search } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import { profile, sidebarGroups } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-4 backdrop-blur-xl lg:ml-[17rem] lg:px-8 xl:px-10 2xl:px-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="搜索项目、笔记、成果或 Skill...（UI 占位）"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Link href="/dashboard/projects/new" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm" aria-label="新建项目">
            <Plus size={18} />
          </Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm" aria-label="通知占位">
            <Bell size={18} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm" aria-label="主题占位">
            <Moon size={18} />
          </button>
          {isSupabaseConfigured ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm"
                aria-label="退出登录"
              >
                <LogOut size={18} />
              </button>
            </form>
          ) : (
            <span className="hidden rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 md:inline">
              Mock Preview
            </span>
          )}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-semibold text-white">
              {profile.avatarInitials}
            </div>
            <span className="hidden text-sm font-medium text-slate-800 sm:inline">{profile.name}</span>
          </div>
        </div>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {sidebarGroups.flatMap((group) => group.items).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
