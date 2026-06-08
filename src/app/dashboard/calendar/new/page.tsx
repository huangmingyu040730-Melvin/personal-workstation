import { createCalendarEventAction } from "@/actions/calendar";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { CalendarEventForm } from "@/components/forms/calendar-event-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getCalendarRelationOptions } from "@/lib/queries/calendar";

export default async function NewCalendarEventPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, options] = await Promise.all([searchParams, getCalendarRelationOptions()]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Calendar" title="新建日程" description="创建站内日程记录，保存后会写入 Supabase calendar_events 表。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="日程边界"
                description="这里是个人工作站内部日程，不会同步到 Google Calendar。"
                items={["日程默认 private。", "不要记录客户敏感信息或完整私人地址。", "适合记录研究安排、截止日期和复盘提醒。"]}
              />
              <AdminFormHelpCard
                title="关联建议"
                tone="slate"
                items={["关联项目用于跟踪研究进度。", "关联成果或知识文章可帮助复盘产出。", "关联 Skill 适合记录自动化维护计划。"]}
              />
            </>
          }
        >
          <CalendarEventForm action={createCalendarEventAction} options={options} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
