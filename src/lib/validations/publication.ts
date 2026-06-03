import { z } from "zod";
import { publicationTypes } from "@/lib/content-options";
import { optionalText, slugSchema, textArraySchema, visibilitySchema } from "./common";

const publicationTypeValues = publicationTypes.map((item) => item.value) as [string, ...string[]];

export const publicationSchema = z.object({
  title: z.string().trim().min(2, "成果标题至少需要 2 个字符").max(160, "成果标题不能超过 160 个字符"),
  slug: slugSchema,
  publication_type: z.enum(publicationTypeValues, { message: "请选择有效成果类型" }),
  summary: z.string().trim().min(8, "简介至少需要 8 个字符").max(600, "简介不能超过 600 个字符"),
  abstract: optionalText(),
  published_on: optionalText(),
  tags: textArraySchema,
  project_id: optionalText(),
  is_featured: z.boolean().default(false),
  visibility: visibilitySchema
});
