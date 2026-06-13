import { z } from "zod";
import { optionalText } from "./common";

const researchAssetTypeValues = ["project", "knowledge", "skill", "publication"] as const;
const researchAssetRelationTypeValues = ["related", "supports", "references", "uses", "produces", "derived_from"] as const;

export const assetLinkCreateSchema = z
  .object({
    source_type: z.enum(researchAssetTypeValues, { message: "请选择有效来源资产类型" }),
    source_id: z.uuid("来源资产 ID 无效"),
    target_type: z.enum(researchAssetTypeValues, { message: "请选择有效目标资产类型" }),
    target_id: z.uuid("目标资产 ID 无效"),
    relation_type: z.enum(researchAssetRelationTypeValues, { message: "请选择有效关系类型" }),
    note: optionalText(500),
    return_to: optionalText()
  })
  .superRefine((value, ctx) => {
    if (value.source_type === value.target_type && value.source_id === value.target_id) {
      ctx.addIssue({
        code: "custom",
        path: ["target_id"],
        message: "不能把资产关联到自身。"
      });
    }
  });

export const assetLinkDeleteSchema = z.object({
  link_id: z.uuid("关系 ID 无效"),
  return_to: optionalText()
});

export const assetLinkUpdateSchema = z.object({
  link_id: z.uuid("关系 ID 无效"),
  relation_type: z.enum(researchAssetRelationTypeValues, { message: "请选择有效关系类型" }),
  note: optionalText(500),
  return_to: optionalText()
});
