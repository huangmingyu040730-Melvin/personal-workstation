import { z } from "zod";
import { documentCategories, documentRelatedTypes } from "@/lib/content-options";
import { optionalText } from "./common";

const documentCategoryValues = documentCategories.map((item) => item.value) as [string, ...string[]];
const relatedTypeValues = documentRelatedTypes.map((item) => item.value) as [string, ...string[]];

export const documentMetadataSchema = z.object({
  name: z.string().trim().min(2, "文件显示名称至少需要 2 个字符").max(180, "文件显示名称不能超过 180 个字符"),
  category: z.enum(documentCategoryValues, { message: "请选择有效文件分类" }),
  related_type: z.preprocess((value) => (value === "" ? null : value), z.enum(relatedTypeValues).nullable()).optional().transform((value) => value ?? null),
  related_id: optionalText()
}).superRefine((value, ctx) => {
  if (value.related_id && !value.related_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "选择关联对象时需要同时选择关联类型",
      path: ["related_type"]
    });
  }

  if (value.related_type && !value.related_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "选择关联类型后需要选择关联对象",
      path: ["related_id"]
    });
  }
});
