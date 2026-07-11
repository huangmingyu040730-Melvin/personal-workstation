import { z } from "zod";
import { optionalText, textArraySchema } from "@/lib/validations/common";

export const workstationResumeItemTypes = [
  "basic",
  "education",
  "experience",
  "project",
  "research",
  "skill",
  "certification",
  "award",
  "language",
  "other"
] as const;

export const workstationResumeSectionKeys = [
  "summary",
  "education",
  "experience",
  "projects",
  "research",
  "skills",
  "certifications",
  "awards",
  "other"
] as const;

export const workstationApplicationStatuses = [
  "draft",
  "reviewed",
  "ready",
  "submitted",
  "interview",
  "rejected",
  "offer",
  "archived"
] as const;

const uuidSchema = z.string().uuid("Invalid id.");
const optionalUuid = z.preprocess(
  (value) => typeof value === "string" && value.trim().length === 0 ? null : value,
  uuidSchema.nullable()
);
const optionalDate = z.preprocess(
  (value) => typeof value === "string" && value.trim().length === 0 ? null : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must use YYYY-MM-DD.").nullable()
);
const jsonRecordSchema = z.record(z.string(), z.unknown()).default({});
const booleanRecordSchema = z.record(z.string(), z.boolean()).default({});

const privateVisibilitySchema = z
  .enum(["private", "public"])
  .optional()
  .refine((value) => value === undefined || value === "private", {
    message: "Workstation Career API can only create private records."
  });

const resumeItemFields = {
  item_type: z.enum(workstationResumeItemTypes),
  title: z.string().trim().min(1, "Title is required.").max(160),
  organization: optionalText(160),
  role_title: optionalText(160),
  location: optionalText(120),
  start_date: optionalDate,
  end_date: optionalDate,
  is_current: z.boolean().default(false),
  summary: optionalText(1500),
  bullets: textArraySchema,
  skills: textArraySchema,
  tags: textArraySchema,
  details: jsonRecordSchema,
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_featured: z.boolean().default(false),
  related_project_id: optionalUuid,
  related_publication_id: optionalUuid,
  related_knowledge_id: optionalUuid,
  related_skill_id: optionalUuid
};

export const workstationResumeItemCreateSchema = z.object({
  ...resumeItemFields,
  visibility: privateVisibilitySchema
}).strict().transform((value) => ({
  ...value,
  visibility: "private" as const,
  end_date: value.is_current ? null : value.end_date
}));

export const workstationResumeItemUpdateSchema = z.object({
  item_type: resumeItemFields.item_type.optional(),
  title: resumeItemFields.title.optional(),
  organization: resumeItemFields.organization.optional(),
  role_title: resumeItemFields.role_title.optional(),
  location: resumeItemFields.location.optional(),
  start_date: resumeItemFields.start_date.optional(),
  end_date: resumeItemFields.end_date.optional(),
  is_current: z.boolean().optional(),
  summary: resumeItemFields.summary.optional(),
  bullets: z.array(z.string().trim().min(1)).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  is_featured: z.boolean().optional(),
  related_project_id: resumeItemFields.related_project_id.optional(),
  related_publication_id: resumeItemFields.related_publication_id.optional(),
  related_knowledge_id: resumeItemFields.related_knowledge_id.optional(),
  related_skill_id: resumeItemFields.related_skill_id.optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one update field is required."
});

export const workstationResumeVersionItemSchema = z.object({
  resume_item_id: uuidSchema,
  section_key: z.enum(workstationResumeSectionKeys),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_visible: z.boolean().default(true),
  note: optionalText(500),
  visible_fields: booleanRecordSchema
}).strict();

const resumeVersionFields = {
  title: z.string().trim().min(1, "Title is required.").max(160),
  target_role: optionalText(160),
  summary: optionalText(1200),
  language: z.enum(["zh", "en"] as const).default("zh"),
  template_key: z.enum(["classic", "compact", "research"] as const).default("classic"),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  notes: optionalText(1200),
  profile_fields: booleanRecordSchema,
  section_order: z.array(z.string().trim().min(1)).default(["education", "experience", "projects", "skills", "research", "certifications", "awards", "other"]),
  template_options: jsonRecordSchema,
  items: z.array(workstationResumeVersionItemSchema).default([])
};

export const workstationResumeVersionCreateSchema = z.object({
  ...resumeVersionFields,
  visibility: privateVisibilitySchema
}).strict().transform((value) => ({
  ...value,
  visibility: "private" as const
}));

export const workstationResumeVersionUpdateSchema = z.object({
  title: resumeVersionFields.title.optional(),
  target_role: resumeVersionFields.target_role.optional(),
  summary: resumeVersionFields.summary.optional(),
  language: z.enum(["zh", "en"] as const).optional(),
  template_key: z.enum(["classic", "compact", "research"] as const).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  notes: resumeVersionFields.notes.optional(),
  profile_fields: z.record(z.string(), z.boolean()).optional(),
  section_order: z.array(z.string().trim().min(1)).optional(),
  template_options: z.record(z.string(), z.unknown()).optional(),
  items: z.array(workstationResumeVersionItemSchema).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one update field is required."
});

export const workstationJdReviewCreateSchema = z.object({
  resume_version_id: uuidSchema,
  company_name: optionalText(160),
  job_title: optionalText(160),
  job_direction: optionalText(80),
  job_location: optionalText(120),
  application_channel: optionalText(120),
  jd_text: z.string().trim().min(20, "JD text is required.").max(20000),
  target_keywords: textArraySchema,
  ai_result: jsonRecordSchema,
  match_summary: optionalText(2000),
  missing_keywords: textArraySchema,
  matched_keywords: textArraySchema,
  risks: textArraySchema,
  next_actions: textArraySchema,
  application_status: z.enum(workstationApplicationStatuses).default("draft"),
  notes: optionalText(2000),
  model_name: optionalText(120)
}).strict();

export const workstationJdReviewUpdateSchema = z.object({
  company_name: optionalText(160).optional(),
  job_title: optionalText(160).optional(),
  job_direction: optionalText(80).optional(),
  job_location: optionalText(120).optional(),
  application_channel: optionalText(120).optional(),
  application_status: z.enum(workstationApplicationStatuses).optional(),
  notes: optionalText(2000).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one update field is required."
});

export const workstationJdAnalyzeSchema = z.object({
  resume_version_id: uuidSchema,
  jd_text: z.string().trim().min(80, "JD text must contain at least 80 characters.").max(12000),
  direction: z.enum(["general", "investment_research", "quant_research", "asset_management", "financial_product", "ai_data"] as const).default("general"),
  company_name: optionalText(160),
  job_title: optionalText(160),
  job_direction: optionalText(80),
  job_location: optionalText(120),
  application_channel: optionalText(120),
  application_status: z.enum(workstationApplicationStatuses).default("reviewed"),
  notes: optionalText(2000)
}).strict();

export const workstationDeleteConfirmationSchema = z.object({
  confirm: z.literal(true)
}).strict();

export type WorkstationResumeItemCreateInput = z.infer<typeof workstationResumeItemCreateSchema>;
export type WorkstationResumeItemUpdateInput = z.infer<typeof workstationResumeItemUpdateSchema>;
export type WorkstationResumeVersionCreateInput = z.infer<typeof workstationResumeVersionCreateSchema>;
export type WorkstationResumeVersionUpdateInput = z.infer<typeof workstationResumeVersionUpdateSchema>;
export type WorkstationJdReviewCreateInput = z.infer<typeof workstationJdReviewCreateSchema>;
export type WorkstationJdReviewUpdateInput = z.infer<typeof workstationJdReviewUpdateSchema>;
export type WorkstationJdAnalyzeInput = z.infer<typeof workstationJdAnalyzeSchema>;
