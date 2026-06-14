import { createAccessGrantAction } from "@/actions/access-grants";
import { AdminFormSection, AdminSecurityNote } from "@/components/admin-ui";
import { accessGrantContentTypes } from "@/lib/content-options";
import type { AccessGrantContentType } from "@/lib/content-types";
import type { GrantContentOptions } from "@/lib/queries/access-grants";
import { visibilityLabel } from "@/lib/utils";
import { ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function AccessGrantForm({
  options,
  error,
  initialEmail,
  initialContentType,
  requestId
}: {
  options: GrantContentOptions;
  error?: string;
  initialEmail?: string;
  initialContentType?: string | null;
  requestId?: string;
}) {
  const defaultType = accessGrantContentTypes.some((item) => item.value === initialContentType)
    ? (initialContentType as AccessGrantContentType)
    : "project";

  return (
    <form action={createAccessGrantAction} className="space-y-5">
      <ErrorNotice message={error} />
      {requestId ? <input type="hidden" name="request_id" value={requestId} /> : null}
      <AdminFormSection title="授权对象" description="授权以邮箱为粒度，外部用户需使用同一邮箱登录。">
      <Field label="被授权邮箱" hint="被授权用户需使用这个邮箱通过外部授权登录入口登录。">
        <TextInput name="grantee_email" type="email" defaultValue={initialEmail ?? ""} placeholder="name@example.com" required maxLength={160} />
      </Field>
      </AdminFormSection>
      <AdminFormSection title="授权内容" description="只允许选择已设置为 restricted 的内容。">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="内容类型">
          <Select name="content_type" defaultValue={defaultType} required>
            {accessGrantContentTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="授权内容" hint="这里只列出已设置为“授权可见”的内容；内容类型需要与所选内容所属分组一致。">
          <Select name="content_id" required>
            <option value="">请选择内容</option>
            {accessGrantContentTypes.map((group) => (
              <optgroup key={group.value} label={group.label}>
                {options[group.value].map((item) => (
                  <option key={`${group.value}-${item.id}`} value={item.id}>
                    {item.title} · {visibilityLabel(item.visibility)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
      </div>
      </AdminFormSection>
      <AdminFormSection title="有效期与备注" description="备注仅后台可见，不会发送给外部用户。">
      <Field label="有效期" hint="可选。不填则长期有效；填写后超过该时间自动失效。">
        <TextInput name="expires_at" type="datetime-local" />
      </Field>
      <Field label="管理员备注" hint="仅后台可见，不会发送给外部用户。">
        <Textarea name="admin_note" className="min-h-32" maxLength={1200} />
      </Field>
      </AdminFormSection>
      <AdminSecurityNote>授权只开放对应内容详情页的只读访问，不开放后台 Documents、私密附件下载、Storage 路径或 signed URL。Viewer 登录仍有已知问题，后续将单独 Hotfix 验证。</AdminSecurityNote>
      <SubmitButton>创建授权</SubmitButton>
    </form>
  );
}
