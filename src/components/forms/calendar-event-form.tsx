import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import { calendarEventTypes } from "@/lib/content-options";
import type { CalendarEventRecord } from "@/lib/content-types";
import { formatDateTimeLocalInputValue } from "@/lib/format";
import type { CalendarEventRelationOptions } from "@/lib/queries/calendar";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function CalendarEventForm({
  action,
  event,
  options,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  event?: CalendarEventRecord | null;
  options: CalendarEventRelationOptions;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />
      <AdminFormSection title="基本信息" description="用于后台列表、详情页和 Dashboard 近期日程展示。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="日程标题">
            <TextInput name="title" defaultValue={event?.title} required />
          </Field>
          <Field label="日程类型">
            <Select name="event_type" defaultValue={event?.event_type ?? "general"}>
              {calendarEventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="开始时间">
            <TextInput name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(event?.starts_at)} required />
          </Field>
          <Field label="结束时间" hint="可选。留空时视为单点事项。">
            <TextInput name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(event?.ends_at)} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="地点">
            <TextInput name="location" defaultValue={event?.location ?? ""} placeholder="可选，例如 线上会议、图书馆、自习室" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="说明" description="日程描述只在管理员后台显示，建议记录行动项而非敏感细节。">
        <Field label="描述">
          <Textarea name="description" defaultValue={event?.description ?? ""} />
        </Field>
      </AdminFormSection>

      <AdminFormSection title="关联对象" description="可选。用于把日程和当前研究工作流联系起来。">
        <div className="grid gap-5 md:grid-cols-2">
          <RelationSelect label="关联项目" name="project_id" value={event?.project_id} options={options.projects} />
          <RelationSelect label="关联成果" name="publication_id" value={event?.publication_id} options={options.publications} />
          <RelationSelect label="关联知识" name="knowledge_note_id" value={event?.knowledge_note_id} options={options.knowledge} />
          <RelationSelect label="关联 Skill" name="skill_id" value={event?.skill_id} options={options.skills} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="可见性" description="默认私密。public 日程可被 RLS 允许公开读取，但本阶段公开页面不会展示日程。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="权限">
            <Select name="visibility" defaultValue={event?.visibility ?? "private"}>
              <option value="private">私密</option>
              <option value="public">公开</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Checkbox checked readOnly label="站内日程，不同步 Google Calendar" />
          </div>
        </div>
      </AdminFormSection>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={event ? `/dashboard/calendar/${event.id}` : "/dashboard/calendar"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}

function RelationSelect({
  label,
  name,
  value,
  options
}: {
  label: string;
  name: string;
  value?: string | null;
  options: Array<{ id: string; title: string }>;
}) {
  return (
    <Field label={label}>
      <Select name={name} defaultValue={value ?? ""}>
        <option value="">不关联</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.title}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function toDateTimeLocal(value: string | null | undefined) {
  return formatDateTimeLocalInputValue(value);
}
