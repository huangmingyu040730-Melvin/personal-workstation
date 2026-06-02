import { z } from "zod";
import { optionalText, slugSchema, textArraySchema, visibilitySchema } from "./common";

export const knowledgeSchema = z.object({
  title: z.string().trim().min(1, "请输入笔记标题").max(140, "笔记标题不能超过 140 个字符"),
  slug: slugSchema,
  category: z.string().trim().min(1, "请选择或输入分类").max(80, "分类不能超过 80 个字符"),
  excerpt: optionalText(),
  content: optionalText(),
  tags: textArraySchema,
  project_id: optionalText(),
  is_featured: z.boolean().default(false),
  visibility: visibilitySchema
});

export type KnowledgeInput = z.infer<typeof knowledgeSchema>;
