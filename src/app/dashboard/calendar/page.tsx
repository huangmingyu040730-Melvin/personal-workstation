import Link from "next/link";
import { CalendarDays, Clock, MapPin, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { calendarEventTypes, getCalendarEventTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getCalendarEvents, getCalendarEventRelation, getCalendarRelationOptions } from "@/lib/queries/calendar";

export default async function DashboardCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const range = params.range ?? "upcoming";
  const eventType = params.event_type ?? "all";
  const visibility = params.visibility ?? "all";
  const [events, relationOptions] = await Promise.all([
    getCalendarEvents({ range: range as "upcoming" | "30days" | "all", eventType, visibility }),
    getCalendarRelationOptions()
  ]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Calendar"
          title="日程管理"
          description="管理站内日程、研究安排、截止日期和复盘提醒。日程默认私密，不接入 Google Calendar。"
          action={
            <Link href="/dashboard/calendar/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
              <Plus size={16} />
              新建日程
            </Link>
          }
        />

        <AdminSection title="筛选" description="默认展示未来日程；可切换到未来 30 天或全部记录。">
          <form className="flex flex-wrap gap-3">
            <select name="range" defaultValue={range} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              <option value="upcoming">未来日程</option>
              <option value="30days">未来 30 天</option>
              <option value="all">全部日程</option>
            </select>
            <select name="event_type" defaultValue={eventType} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              <option value="all">全部类型</option>
              {calendarEventTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select name="visibility" defaultValue={visibility} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              <option value="all">全部权限</option>
              <option value="private">私密</option>
              <option value="public">公开</option>
            </select>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
          </form>
        </AdminSection>

        {events.length === 0 ? (
          <AdminEmptyState
            title="还没有日程"
            description="创建第一个站内日程后，Dashboard 会显示最近即将到来的事项。"
            action={<Link href="/dashboard/calendar/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建日程</Link>}
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {events.map((event) => {
              const relation = getCalendarEventRelation(event, relationOptions);

              return (
                <AdminContentCard key={event.id} href={`/dashboard/calendar/${event.id}`} className="hover:border-blue-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getCalendarEventTypeLabel(event.event_type)}</Badge>
                        <VisibilityBadge visibility={event.visibility} />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-950">{event.title}</h2>
                      {event.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p> : null}
                    </div>
                    <CalendarDays className="shrink-0 text-blue-700" size={22} />
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <span className="flex items-center gap-2"><Clock size={16} />{formatDateTime(event.starts_at)}</span>
                    <span className="flex items-center gap-2"><MapPin size={16} />{event.location || "未设置地点"}</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>{relation ? `${relation.label}：${relation.title}` : "未关联对象"}</span>
                    <span>更新于 {formatRelative(event.updated_at)}</span>
                  </div>
                </AdminContentCard>
              );
            })}
          </div>
        )}
      </AdminPageSurface>
    </AppShell>
  );
}
