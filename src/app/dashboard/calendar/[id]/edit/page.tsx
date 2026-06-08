import { notFound } from "next/navigation";
import { updateCalendarEventAction } from "@/actions/calendar";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { CalendarEventForm } from "@/components/forms/calendar-event-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getCalendarEventById, getCalendarRelationOptions } from "@/lib/queries/calendar";

export default async function EditCalendarEventPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, options] = await Promise.all([params, searchParams, getCalendarRelationOptions()]);
  const event = await getCalendarEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Calendar" title="编辑日程" description="保存后会刷新日程详情、列表和 Dashboard 近期日程。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="编辑检查"
                description="更新日程时，请确认时间、可见性和关联对象仍然准确。"
                items={["结束时间可以留空。", "public 日程目前不会出现在公开页面。", "Google Calendar 集成尚未启用。"]}
              />
              <AdminFormHelpCard
                title="隐私提醒"
                tone="slate"
                items={["private 日程仅管理员后台可见。", "不要记录私人手机号、完整地址或客户敏感信息。", "日程不会暴露 Documents 或附件链接。"]}
              />
            </>
          }
        >
          <CalendarEventForm action={updateCalendarEventAction.bind(null, event.id)} event={event} options={options} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
