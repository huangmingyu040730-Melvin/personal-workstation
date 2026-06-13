"use client";

import { updateAssetLinkAction } from "@/actions/asset-links";
import { Field, Select, Textarea } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { researchAssetRelationTypes } from "@/lib/content-options";
import type { ResolvedAssetLink } from "@/lib/queries/asset-links";

type EditAssetLinkFormProps = {
  link: ResolvedAssetLink;
  returnTo: string;
};

export function EditAssetLinkForm({ link, returnTo }: EditAssetLinkFormProps) {
  return (
    <form action={updateAssetLinkAction} className="mt-3 space-y-3 border-t border-slate-200 pt-3">
      <input type="hidden" name="link_id" value={link.id} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <Field label="关系">
          <Select name="relation_type" defaultValue={link.relation_type}>
            {researchAssetRelationTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="备注" hint="只能修改关系类型和备注；如需更换对方资产，请删除后重新创建。">
          <Textarea name="note" maxLength={500} rows={3} defaultValue={link.note ?? ""} className="min-h-24" />
        </Field>
      </div>

      <SubmitButton variant="secondary" pendingLabel="保存中...">
        保存关系
      </SubmitButton>
    </form>
  );
}
