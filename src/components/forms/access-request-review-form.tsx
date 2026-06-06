import { reviewAccessRequestAction } from "@/actions/access-requests";
import type { AccessRequestRecord } from "@/lib/content-types";
import { accessRequestStatuses } from "@/lib/content-options";
import { ErrorNotice, Field, Select, Textarea } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function AccessRequestReviewForm({
  request,
  error
}: {
  request: AccessRequestRecord;
  error?: string;
}) {
  return (
    <form action={reviewAccessRequestAction.bind(null, request.id)} className="space-y-5">
      <ErrorNotice message={error} />
      <Field label="处理状态">
        <Select name="status" defaultValue={request.status}>
          {accessRequestStatuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </Select>
      </Field>
      <Field label="内部备注 / 处理说明" hint="仅后台可见。本阶段不会自动通知申请人，也不会自动开放受限内容。">
        <Textarea name="admin_note" defaultValue={request.admin_note ?? ""} className="min-h-44" maxLength={1200} />
      </Field>
      <SubmitButton>保存处理结果</SubmitButton>
    </form>
  );
}
