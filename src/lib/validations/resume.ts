import { z } from "zod";
import { optionalText, textArraySchema } from "./common";

const jsonRecordSchema = z.record(z.string(), z.unknown()).default({});

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

const optionalDate = z.preprocess(
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
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正确。").nullable()
);

export const resumeItemSchema = z
  .object({
    item_type: z.enum(["basic", "education", "experience", "project", "research", "skill", "certification", "award", "language", "other"], {
      message: "请选择有效的履历素材类型。"
    }),
    title: z.string().trim().min(1, "请输入素材标题。").max(160, "素材标题不能超过 160 个字符。"),
    organization: optionalText(160),
    role_title: optionalText(160),
    location: optionalText(120),
    start_date: optionalDate,
    end_date: optionalDate,
    is_current: z.boolean(),
    summary: optionalText(1500),
    bullets: textArraySchema,
    skills: textArraySchema,
    tags: textArraySchema,
    details: jsonRecordSchema,
    sort_order: z.coerce.number().int("排序值必须是整数。").min(0, "排序值不能小于 0。").max(9999, "排序值不能超过 9999。"),
    visibility: z.enum(["private", "public"], { message: "请选择有效的素材权限。" }),
    is_featured: z.boolean(),
    related_project_id: optionalUuid,
    related_publication_id: optionalUuid,
    related_knowledge_id: optionalUuid,
    related_skill_id: optionalUuid
  })
  .refine((value) => value.is_current || !value.start_date || !value.end_date || value.end_date >= value.start_date, {
    message: "结束日期不能早于开始日期。",
    path: ["end_date"]
  })
  .transform((value) => ({
    ...value,
    end_date: value.is_current ? null : value.end_date
  }));

export type ResumeItemInput = z.infer<typeof resumeItemSchema>;

export const resumeVersionItemSchema = z.object({
  resume_item_id: z.string().uuid("简历素材格式不正确。"),
  section_key: z.enum(["summary", "education", "experience", "projects", "research", "skills", "certifications", "awards", "other"], {
    message: "请选择有效的简历区块。"
  }),
  sort_order: z.coerce.number().int("素材排序值必须是整数。").min(0, "素材排序值不能小于 0。").max(9999, "素材排序值不能超过 9999。"),
  is_visible: z.boolean(),
  note: optionalText(500),
  visible_fields: z.record(z.string(), z.boolean()).default({})
});

export const resumeVersionSchema = z.object({
  title: z.string().trim().min(1, "请输入简历版本名称。").max(160, "简历版本名称不能超过 160 个字符。"),
  target_role: optionalText(160),
  summary: optionalText(1200),
  language: z.enum(["zh", "en"], { message: "请选择有效语言。" }),
  template_key: z.enum(["classic", "compact", "research"], { message: "请选择有效模板。" }),
  visibility: z.enum(["private", "public"], { message: "请选择有效的简历版本权限。" }),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  notes: optionalText(1200),
  profile_fields: z.record(z.string(), z.boolean()).default({}),
  section_order: z.array(z.string()).default(["education", "experience", "campus", "projects", "research", "skills", "certifications", "awards", "other"]),
  template_options: jsonRecordSchema,
  items: z.array(resumeVersionItemSchema).default([])
});

export type ResumeVersionInput = z.infer<typeof resumeVersionSchema>;
