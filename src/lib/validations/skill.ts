import { z } from "zod";
import { optionalText, slugSchema, textArraySchema, visibilitySchema } from "./common";

export const skillSchema = z.object({
  name: z.string().trim().min(1, "请输入 Skill 名称").max(120, "Skill 名称不能超过 120 个字符"),
  slug: slugSchema,
  description: z.string().trim().min(1, "请输入简短描述").max(500, "简短描述不能超过 500 个字符"),
  content: optionalText(),
  category: z.string().trim().min(1, "请选择分类"),
  platforms: textArraySchema,
  status: z.enum(["idea", "developing", "testing", "available", "archived"], { message: "请选择有效状态" }),
  current_version: optionalText(),
  input_description: optionalText(),
  output_description: optionalText(),
  usage_guide: optionalText(),
  skill_md_content: optionalText(),
  repository_url: optionalText(),
  is_featured: z.boolean().default(false),
  visibility: visibilitySchema,
  create_initial_version: z.boolean().default(false),
  version_notes: optionalText(),
  version_released_at: optionalText()
});

export const skillVersionSchema = z.object({
  version: z.string().trim().min(1, "请输入版本号").max(40, "版本号不能超过 40 个字符"),
  notes: optionalText(),
  released_at: optionalText()
});

export type SkillInput = z.infer<typeof skillSchema>;
export type SkillVersionInput = z.infer<typeof skillVersionSchema>;
