import { z } from "zod";
import { optionalText, textArraySchema } from "./common";

const publicKeyValueSchema = z.record(z.string().min(1), z.string().min(1)).default({});

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, "请输入公开姓名").max(80, "公开姓名不能超过 80 个字符"),
  headline: optionalText(160),
  bio: optionalText(1200),
  education: optionalText(500),
  role_title: optionalText(120),
  organization: optionalText(120),
  location: optionalText(120),
  research_interests: textArraySchema,
  skill_tags: textArraySchema,
  contact: publicKeyValueSchema,
  social_links: publicKeyValueSchema,
  avatar_url: optionalText(500),
  resume_url: optionalText(500),
  is_public: z.boolean().default(false),
  visibility: z.enum(["public", "private"], { message: "请选择是否公开展示" })
});

export type ProfileInput = z.infer<typeof profileSchema>;
