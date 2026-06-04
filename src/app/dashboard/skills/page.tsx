import Link from "next/link";
import { Bot, Layers3, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { skillStatuses, visibilityOptions } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getSkills } from "@/lib/queries/skills";

export default async function SkillsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const visibility = params.visibility ?? "all";
  const skills = await getSkills({ status, visibility });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Skills Library"
        title="Skill 库"
        description="从 Supabase 读取真实 Skill，管理研究、写作、自动化和知识工作流能力。"
        action={<Link href="/dashboard/skills/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><Plus size={16} />新建 Skill</Link>}
      />
      <form className="mb-5 flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
          <option value="all">全部状态</option>
          {skillStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select name="visibility" defaultValue={visibility} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
          <option value="all">全部权限</option>
          {visibilityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:text-blue-700">筛选</button>
      </form>
      {skills.length === 0 ? (
        <Card className="text-center">
          <p className="font-semibold text-slate-900">还没有 Skill</p>
          <p className="mt-2 text-sm text-slate-500">创建第一个 Skill 后，Dashboard 和公开首页会读取真实更新。</p>
          <Link href="/dashboard/skills/new" className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建 Skill</Link>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {skills.map((skill) => (
            <Link key={skill.id} href={`/dashboard/skills/${skill.id}`} className="block">
              <Card className="relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-blue-100 to-violet-100" />
                <div className="relative">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
                        <Bot size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">{skill.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">{skill.category}</p>
                      </div>
                    </div>
                    <StatusBadge status={skill.status} />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{skill.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {skill.platforms.map((platform) => (
                      <span key={platform} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <Layers3 size={12} />
                        {platform}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500">{skill.current_version ?? "未设版本"} · {formatRelative(skill.updated_at)}</span>
                    <VisibilityBadge visibility={skill.visibility} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
