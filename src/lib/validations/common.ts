import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(2, "slug 至少需要 2 个字符")
  .max(80, "slug 不能超过 80 个字符")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能使用小写字母、数字和连字符");

export const visibilitySchema = z.enum(["public", "private", "unlisted", "restricted"], {
  message: "请选择有效权限"
});

export const textArraySchema = z.array(z.string().trim().min(1)).default([]);

export function optionalText() {
  return z.preprocess((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().nullable());
}
