import { z } from "zod";
import { optionalText } from "./common";

const allowedAccessRequestContentTypes = ["project", "publication", "skill", "knowledge", "other"] as const;
const allowedAccessRequestStatuses = ["pending", "approved", "rejected"] as const;

const optionalAccessRequestContentType = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value;
}, z.enum(allowedAccessRequestContentTypes, { message: "请选择有效内容类型" }).nullable());

const optionalRequestUrl = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(300, "内容链接不能超过 300 个字符").refine((value) => {
  if (!value) {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "请输入有效链接，或填写站内路径，例如 /projects/example").nullable());

export const submitAccessRequestSchema = z.object({
  requester_name: z.string().trim().min(1, "请输入姓名").max(80, "姓名不能超过 80 个字符"),
  requester_email: z.string().trim().email("请输入有效邮箱").max(160, "邮箱不能超过 160 个字符"),
  organization: optionalText().pipe(z.string().max(120, "机构 / 身份不能超过 120 个字符").nullable()),
  requested_content_type: optionalAccessRequestContentType,
  requested_content_title: optionalText().pipe(z.string().max(160, "内容标题不能超过 160 个字符").nullable()),
  requested_content_url: optionalRequestUrl,
  reason: z.string().trim().min(10, "申请理由至少需要 10 个字符").max(1200, "申请理由不能超过 1200 个字符")
});

export const reviewAccessRequestSchema = z.object({
  status: z.enum(allowedAccessRequestStatuses, { message: "请选择有效处理状态" }),
  admin_note: optionalText().pipe(z.string().max(1200, "内部备注不能超过 1200 个字符").nullable())
});

export type SubmitAccessRequestInput = z.infer<typeof submitAccessRequestSchema>;
export type ReviewAccessRequestInput = z.infer<typeof reviewAccessRequestSchema>;
