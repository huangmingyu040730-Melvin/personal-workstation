import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { todayItems } from "@/lib/mock-data";

const days = Array.from({ length: 35 }, (_, index) => index + 1);

export default function CalendarPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendar"
        title="日历"
        description="静态月历和今日事项列表，后续可接入真实日程新增、编辑和提醒。"
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
        <Card>
          <CardHeader title="2026 年 5 月" />
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
              <div key={day} className="py-2 font-medium text-slate-500">{day}</div>
            ))}
            {days.map((day) => (
              <div
                key={day}
                className="min-h-24 rounded-2xl border border-slate-100 bg-slate-50 p-2 text-left"
              >
                <span className={day === 31 ? "flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white" : "text-sm font-medium text-slate-700"}>
                  {day}
                </span>
                {[12, 18, 24, 31].includes(day) ? (
                  <div className="mt-3 rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-700">研究安排</div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="今日事项" />
          <div className="space-y-3">
            {todayItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-semibold text-blue-700">{item.time}</p>
                <p className="mt-2 font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.type}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
