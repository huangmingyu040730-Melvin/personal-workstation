import { z } from "zod";
import { documentCategories, documentCollectionTypes, documentRelatedTypes } from "@/lib/content-options";
import { optionalText } from "./common";

const documentCategoryValues = documentCategories.map((item) => item.value) as [string, ...string[]];
const relatedTypeValues = documentRelatedTypes.map((item) => item.value) as [string, ...string[]];
const collectionTypeValues = documentCollectionTypes.map((item) => item.value) as [string, ...string[]];

export const documentMetadataSchema = z.object({
  name: z.string().trim().min(2, "文件显示名称至少需要 2 个字符").max(180, "文件显示名称不能超过 180 个字符"),
  category: z.enum(documentCategoryValues, { message: "请选择有效文件分类" }),
  related_type: z.preprocess((value) => (value === "" ? null : value), z.enum(relatedTypeValues).nullable()).optional().transform((value) => value ?? null),
  related_id: optionalText(),
  collection_id: optionalText(),
  original_name: optionalText(),
  relative_path: optionalText()
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

export const documentCollectionMetadataSchema = z.object({
  title: z.string().trim().min(2, "文档包名称至少需要 2 个字符").max(180, "文档包名称不能超过 180 个字符"),
  description: optionalText(),
  collection_type: z.enum(collectionTypeValues, { message: "请选择有效文档包类型" }),
  related_type: z.preprocess((value) => (value === "" ? null : value), z.enum(relatedTypeValues).nullable()).optional().transform((value) => value ?? null),
  related_id: optionalText(),
  root_folder_name: optionalText(),
  file_count: z.coerce.number().int().positive("请选择需要上传的文件"),
  total_size: z.coerce.number().int().positive("请选择需要上传的文件")
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
