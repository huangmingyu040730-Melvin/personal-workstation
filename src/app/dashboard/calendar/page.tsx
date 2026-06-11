import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, List, MapPin, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { calendarEventTypes, getCalendarEventTypeLabel } from "@/lib/content-options";
import type { CalendarEventRecord, CalendarEventType } from "@/lib/content-types";
import { formatDateInputValue, formatDateTime, formatRelative, formatTime } from "@/lib/format";
import { getCalendarEvents, getCalendarEventRelation, getCalendarRelationOptions } from "@/lib/queries/calendar";
import { cn } from "@/lib/utils";

const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];

export default async function DashboardCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "month";
  const month = parseMonthParam(params.month) ?? getMonthKey(new Date());
  const range = params.range ?? "upcoming";
  const eventType = params.event_type ?? "all";
  const visibility = params.visibility ?? "all";
  const monthMeta = getMonthMeta(month);

  const [events, relationOptions] = await Promise.all([
    getCalendarEvents(
      view === "month"
        ? {
            startsAfter: monthMeta.visibleStartIso,
            startsBefore: monthMeta.visibleEndIso,
            eventType,
            visibility
          }
        : { range: range as "upcoming" | "30days" | "all", eventType, visibility }
    ),
    getCalendarRelationOptions()
  ]);
  const eventsByDate = groupEventsByDate(events);
  const monthTitle = `${monthMeta.year} 年 ${String(monthMeta.month).padStart(2, "0")} 月`;

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

        <AdminSection title="视图与筛选" description="月视图适合浏览安排密度；列表视图适合快速管理即将到来的日程。">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ViewTab href={calendarHref({ view: "month", month, eventType, visibility })} active={view === "month"} icon={<CalendarDays size={16} />}>
                月视图
              </ViewTab>
              <ViewTab href={calendarHref({ view: "list", range, eventType, visibility })} active={view === "list"} icon={<List size={16} />}>
                列表视图
              </ViewTab>
            </div>
            {view === "month" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link href={calendarHref({ view: "month", month: monthMeta.previousMonth, eventType, visibility })} className="inline-flex h-10 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">
                  <ChevronLeft size={16} />
                  上个月
                </Link>
                <Link href={calendarHref({ view: "month", month: getMonthKey(new Date()), eventType, visibility })} className="inline-flex h-10 items-center rounded-2xl border border-blue-100 bg-blue-50 px-3 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-white">
                  今天
                </Link>
                <Link href={calendarHref({ view: "month", month: monthMeta.nextMonth, eventType, visibility })} className="inline-flex h-10 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">
                  下个月
                  <ChevronRight size={16} />
                </Link>
              </div>
            ) : null}
          </div>

          <form className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="view" value={view} />
            {view === "month" ? <input type="hidden" name="month" value={month} /> : null}
            {view === "list" ? (
              <select name="range" defaultValue={range} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                <option value="upcoming">未来日程</option>
                <option value="30days">未来 30 天</option>
                <option value="all">全部日程</option>
              </select>
            ) : null}
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

        {view === "month" ? (
          <MonthCalendar title={monthTitle} month={month} days={monthMeta.days} eventsByDate={eventsByDate} />
        ) : (
          <CalendarList events={events} relationOptions={relationOptions} />
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function ViewTab({ href, active, icon, children }: { href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition hover:-translate-y-0.5",
        active ? "bg-navy-900 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function MonthCalendar({
  title,
  month,
  days,
  eventsByDate
}: {
  title: string;
  month: string;
  days: CalendarDay[];
  eventsByDate: Map<string, CalendarEventRecord[]>;
}) {
  const visibleEventCount = Array.from(eventsByDate.values()).reduce((sum, events) => sum + events.length, 0);

  return (
    <AdminSection
      title={title}
      description={visibleEventCount > 0 ? `当前视图共 ${visibleEventCount} 条日程。点击日程可进入详情。` : "当前月份暂无日程，可以从右上角新建。"}
    >
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
                周{label}
              </div>
            ))}
            {days.map((day) => {
              const events = eventsByDate.get(day.key) ?? [];
              const isCurrentMonth = day.key.startsWith(month);

              return (
                <div
                  key={day.key}
                  className={cn(
                    "group min-h-36 rounded-3xl border p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-soft",
                    isCurrentMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/60 text-slate-400",
                    day.isToday && "border-blue-200 bg-blue-50/70"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                        day.isToday ? "bg-blue-700 text-white shadow-sm" : isCurrentMonth ? "text-slate-800" : "text-slate-400"
                      )}
                    >
                      {day.dayOfMonth}
                    </span>
                    {events.length > 0 ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{events.length} 项</span> : null}
                  </div>
                  <div className="space-y-2">
                    {events.slice(0, 3).map((event) => (
                      <CalendarEventPill key={event.id} event={event} />
                    ))}
                    {events.length > 3 ? <p className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">还有 {events.length - 3} 条</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}

function CalendarEventPill({ event }: { event: CalendarEventRecord }) {
  return (
    <Link
      href={`/dashboard/calendar/${event.id}`}
      className={cn(
        "block rounded-2xl border px-2.5 py-2 text-xs leading-5 transition hover:-translate-y-0.5 hover:shadow-sm",
        eventTone(event.event_type)
      )}
    >
      <span className="block font-semibold">{formatTime(event.starts_at)}</span>
      <span className="line-clamp-2">{event.title}</span>
    </Link>
  );
}

function CalendarList({
  events,
  relationOptions
}: {
  events: CalendarEventRecord[];
  relationOptions: Awaited<ReturnType<typeof getCalendarRelationOptions>>;
}) {
  if (events.length === 0) {
    return (
      <AdminEmptyState
        title="还没有日程"
        description="创建第一个站内日程后，Dashboard 会显示最近即将到来的事项。"
        action={<Link href="/dashboard/calendar/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建日程</Link>}
      />
    );
  }

  return (
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
  );
}

function parseMonthParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);

  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return null;
  }

  return value;
}

function getMonthMeta(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekdayOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekdayOffset + daysInMonth) / 7) * 7;
  const visibleStart = new Date(Date.UTC(year, month - 1, 1 - firstWeekdayOffset));
  const days = Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(visibleStart);
    date.setUTCDate(visibleStart.getUTCDate() + index);
    const key = getMonthDayKey(date);

    return {
      key,
      dayOfMonth: date.getUTCDate(),
      isToday: key === getMonthDayKey(new Date())
    };
  });

  return {
    year,
    month,
    days,
    previousMonth: getMonthKey(new Date(Date.UTC(year, month - 2, 1))),
    nextMonth: getMonthKey(new Date(Date.UTC(year, month, 1))),
    visibleStartIso: toShanghaiStartIso(days[0].key),
    visibleEndIso: toShanghaiEndIso(days[days.length - 1].key)
  };
}

type CalendarDay = ReturnType<typeof getMonthMeta>["days"][number];

function getMonthKey(date: Date) {
  return getMonthDayKey(date).slice(0, 7);
}

function getMonthDayKey(date: Date) {
  return formatDateInputValue(date);
}

function groupEventsByDate(events: CalendarEventRecord[]) {
  const map = new Map<string, CalendarEventRecord[]>();

  for (const event of events) {
    const key = getMonthDayKey(new Date(event.starts_at));
    const dayEvents = map.get(key) ?? [];
    dayEvents.push(event);
    dayEvents.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    map.set(key, dayEvents);
  }

  return map;
}

function toShanghaiStartIso(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+08:00`).toISOString();
}

function toShanghaiEndIso(dateKey: string) {
  return new Date(`${dateKey}T23:59:59+08:00`).toISOString();
}

function calendarHref({
  view,
  month,
  range,
  eventType,
  visibility
}: {
  view: "month" | "list";
  month?: string;
  range?: string;
  eventType?: string;
  visibility?: string;
}) {
  const params = new URLSearchParams({ view });

  if (month) {
    params.set("month", month);
  }

  if (range && view === "list") {
    params.set("range", range);
  }

  if (eventType && eventType !== "all") {
    params.set("event_type", eventType);
  }

  if (visibility && visibility !== "all") {
    params.set("visibility", visibility);
  }

  return `/dashboard/calendar?${params.toString()}`;
}

function eventTone(type: CalendarEventType) {
  const tones: Record<CalendarEventType, string> = {
    general: "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300",
    meeting: "border-blue-100 bg-blue-50 text-blue-800 hover:border-blue-200",
    research: "border-emerald-100 bg-emerald-50 text-emerald-800 hover:border-emerald-200",
    deadline: "border-rose-100 bg-rose-50 text-rose-800 hover:border-rose-200",
    review: "border-amber-100 bg-amber-50 text-amber-800 hover:border-amber-200",
    reminder: "border-violet-100 bg-violet-50 text-violet-800 hover:border-violet-200"
  };

  return tones[type];
}
