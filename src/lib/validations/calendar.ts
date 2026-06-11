import { z } from "zod";
import { optionalText } from "./common";

const optionalUuid = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    return value;
  },
  z.string().uuid("关联对象格式不正确。").nullable()
);

function normalizeDateTime(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export const calendarEventSchema = z
  .object({
    title: z.string().trim().min(1, "请输入日程标题。").max(120, "日程标题不能超过 120 个字符。"),
    description: optionalText(1200),
    location: optionalText(160),
    starts_at: z.preprocess(normalizeDateTime, z.string().min(1, "请选择开始时间。")),
    ends_at: z.preprocess(normalizeDateTime, z.string().nullable()),
    event_type: z.enum(["general", "meeting", "research", "deadline", "review", "reminder"], { message: "请选择有效的日程类型。" }),
    visibility: z.enum(["private", "public"], { message: "请选择日程可见性。" }),
    project_id: optionalUuid,
    publication_id: optionalUuid,
    knowledge_note_id: optionalUuid,
    skill_id: optionalUuid
  })
  .transform((value) => ({
    ...value,
    starts_at: toShanghaiIso(value.starts_at),
    ends_at: value.ends_at ? toShanghaiIso(value.ends_at) : null
  }))
  .refine((value) => !value.ends_at || new Date(value.ends_at).getTime() >= new Date(value.starts_at).getTime(), {
    message: "结束时间不能早于开始时间。",
    path: ["ends_at"]
  });

function toShanghaiIso(value: string) {
  // Persist calendar form values as UTC/ISO; display conversion stays in src/lib/format.ts.
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value).toISOString();
  }

  return new Date(`${value}:00+08:00`).toISOString();
}

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
