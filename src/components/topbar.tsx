import { Bell, Moon, Plus, Search } from "lucide-react";
import Link from "next/link";
import { profile, sidebarGroups } from "@/lib/mock-data";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/85 px-4 py-4 backdrop-blur lg:ml-72 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            placeholder="搜索项目、笔记、成果或 Skill..."
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-700">
            <Plus size={18} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-700">
            <Bell size={18} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-700">
            <Moon size={18} />
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
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
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
