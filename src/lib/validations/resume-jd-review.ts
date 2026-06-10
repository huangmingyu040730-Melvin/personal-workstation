import { z } from "zod";
import { optionalText, textArraySchema } from "./common";

export const resumeJdReviewStatuses = ["draft", "reviewed", "ready", "submitted", "interview", "rejected", "offer", "archived"] as const;

export const resumeJdReviewSaveSchema = z.object({
  resume_version_id: z.string().uuid("简历版本格式不正确。"),
  company_name: optionalText(160),
  job_title: optionalText(160),
  job_direction: optionalText(80),
  job_location: optionalText(120),
  application_channel: optionalText(120),
  jd_text: z.string().trim().min(20, "JD 原文不能为空。").max(20000, "JD 原文过长，请控制在 20000 字以内。"),
  target_keywords: textArraySchema,
  ai_result: z.record(z.string(), z.unknown()).default({}),
  match_summary: optionalText(2000),
  missing_keywords: textArraySchema,
  matched_keywords: textArraySchema,
  risks: textArraySchema,
  next_actions: textArraySchema,
  application_status: z.enum(resumeJdReviewStatuses, { message: "请选择有效的投递状态。" }).default("draft"),
  notes: optionalText(2000),
  model_name: optionalText(120)
});

export const resumeJdReviewUpdateSchema = z.object({
  company_name: optionalText(160),
  job_title: optionalText(160),
  job_direction: optionalText(80),
  job_location: optionalText(120),
  application_channel: optionalText(120),
  application_status: z.enum(resumeJdReviewStatuses, { message: "请选择有效的投递状态。" }),
  notes: optionalText(2000)
});

export type ResumeJdReviewSaveInput = z.infer<typeof resumeJdReviewSaveSchema>;
export type ResumeJdReviewUpdateInput = z.infer<typeof resumeJdReviewUpdateSchema>;
