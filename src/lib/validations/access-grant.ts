import { z } from "zod";
import { optionalText } from "./common";

export const accessGrantContentTypeSchema = z.enum(["project", "publication", "skill", "knowledge"], {
  message: "请选择有效内容类型"
});

export const accessGrantSchema = z.object({
  grantee_email: z.string().trim().email("请输入有效邮箱").max(160, "邮箱不能超过 160 个字符"),
  content_type: accessGrantContentTypeSchema,
  content_id: z.string().uuid("请选择要授权的内容"),
  expires_at: optionalText(),
  admin_note: optionalText(),
  request_id: optionalText()
});

export const revokeAccessGrantSchema = z.object({
  id: z.string().uuid("授权记录无效")
});
