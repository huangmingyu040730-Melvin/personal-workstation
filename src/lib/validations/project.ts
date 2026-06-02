import { z } from "zod";
import { optionalText, slugSchema, textArraySchema, visibilitySchema } from "./common";

export const projectSchema = z.object({
  title: z.string().trim().min(1, "请输入项目标题").max(120, "项目标题不能超过 120 个字符"),
  slug: slugSchema,
  summary: z.string().trim().min(1, "请输入项目简介").max(500, "项目简介不能超过 500 个字符"),
  background: optionalText(),
  research_question: optionalText(),
  methodology: optionalText(),
  status: z.enum(["planning", "in_progress", "completed", "archived"], { message: "请选择有效项目状态" }),
  progress: z.coerce.number().int("进度必须是整数").min(0, "进度不能小于 0").max(100, "进度不能大于 100"),
  tags: textArraySchema,
  milestones: textArraySchema,
  start_date: optionalText(),
  is_featured: z.boolean().default(false),
  visibility: visibilitySchema
});

export type ProjectInput = z.infer<typeof projectSchema>;
