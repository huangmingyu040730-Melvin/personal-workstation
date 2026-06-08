import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { deleteCalendarEventAction } from "@/actions/calendar";
import { AppShell } from "@/components/app-shell";
import { AdminDangerZone, AdminPageSurface } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getCalendarEventTypeLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getCalendarEventById, getCalendarEventRelation, getCalendarRelationOptions } from "@/lib/queries/calendar";

export default async function CalendarEventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, relationOptions] = await Promise.all([params, searchParams, getCalendarRelationOptions()]);
  const event = await getCalendarEventById(id);

  if (!event) {
    notFound();
  }

  const relation = getCalendarEventRelation(event, relationOptions);
  const deleteAction = deleteCalendarEventAction.bind(null, event.id);
  const error = getFormError(query);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Calendar Detail"
          title={event.title}
          description="站内日程详情。日程默认私密，不会同步到外部日历。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/calendar/${event.id}/edit`} className="rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">编辑</Link>
              <Link href="/dashboard/calendar" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">返回列表</Link>
            </div>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        <div className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader title="日程说明" />
              <MarkdownPreview content={event.description} emptyText="尚未填写日程说明。" />
            </Card>
            <AdminDangerZone description="删除日程会移除这条站内记录，不会影响关联项目、成果、知识文章或 Skill。">
              <form action={deleteAction}>
                <DeleteButton label="删除日程" />
              </form>
            </AdminDangerZone>
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader title="时间与类型" action={<VisibilityBadge visibility={event.visibility} />} />
              <div className="mb-5 flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getCalendarEventTypeLabel(event.event_type)}</Badge>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <Clock className="mt-0.5 shrink-0 text-blue-700" size={17} />
                  <div>
                    <dt className="text-slate-500">开始时间</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatDateTime(event.starts_at)}</dd>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <Clock className="mt-0.5 shrink-0 text-blue-700" size={17} />
                  <div>
                    <dt className="text-slate-500">结束时间</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatDateTime(event.ends_at)}</dd>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <MapPin className="mt-0.5 shrink-0 text-blue-700" size={17} />
                  <div>
                    <dt className="text-slate-500">地点</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{event.location || "未设置"}</dd>
                  </div>
                </div>
              </dl>
            </Card>
            <Card>
              <CardHeader title="关联对象" action={<CalendarDays size={18} className="text-blue-700" />} />
              {relation ? (
                <Link href={relation.href} className="block rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm transition hover:bg-white">
                  <p className="font-semibold text-blue-800">{relation.label}</p>
                  <p className="mt-1 text-slate-700">{relation.title}</p>
                </Link>
              ) : (
                <p className="text-sm text-slate-500">未关联项目、成果、知识文章或 Skill。</p>
              )}
            </Card>
            <Card>
              <CardHeader title="记录信息" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-slate-500">创建时间</dt><dd className="font-medium text-slate-800">{formatDateTime(event.created_at)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">更新时间</dt><dd className="font-medium text-slate-800">{formatDateTime(event.updated_at)}</dd></div>
              </dl>
            </Card>
          </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
