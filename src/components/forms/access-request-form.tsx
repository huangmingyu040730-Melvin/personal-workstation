import Link from "next/link";
import { submitAccessRequestAction } from "@/actions/access-requests";
import { accessRequestContentTypes } from "@/lib/content-options";
import { ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

type AccessRequestInitialValues = {
  requested_content_type?: string | null;
  requested_content_title?: string | null;
  requested_content_url?: string | null;
};

export function AccessRequestForm({
  error,
  success,
  initialValues,
  returnTo = "/access-request"
}: {
  error?: string;
  success?: boolean;
  initialValues?: AccessRequestInitialValues;
  returnTo?: string;
}) {
  if (success) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-lg font-semibold text-emerald-900">申请已提交</p>
        <p className="mt-2 text-sm leading-7 text-emerald-800">申请已提交，我会在合适的时候查看并处理。提交成功不会自动创建访问授权或开放附件。</p>
        <Link href="/" className="mt-5 inline-flex rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
          返回公开首页
        </Link>
      </div>
    );
  }

  return (
    <form action={submitAccessRequestAction} className="space-y-5">
      <ErrorNotice message={error} />
      <input type="hidden" name="return_to" value={returnTo} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="姓名">
          <TextInput name="requester_name" required maxLength={80} />
        </Field>
        <Field label="邮箱">
          <TextInput name="requester_email" type="email" required maxLength={160} />
        </Field>
      </div>
      <Field label="机构 / 身份" hint="可选，例如学校、公司、研究方向或职业身份。">
        <TextInput name="organization" maxLength={120} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="希望查看的内容类型">
          <Select name="requested_content_type" defaultValue={initialValues?.requested_content_type ?? ""}>
            <option value="">暂不指定</option>
            {accessRequestContentTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="希望查看的内容标题">
          <TextInput name="requested_content_title" defaultValue={initialValues?.requested_content_title ?? ""} maxLength={160} />
        </Field>
      </div>
      <Field label="内容链接" hint="可选。可以填写站内路径，例如 /projects/example，或公开网页链接。">
        <TextInput name="requested_content_url" defaultValue={initialValues?.requested_content_url ?? ""} maxLength={300} />
      </Field>
      <Field label="申请理由 / 预期用途" hint="请简要说明希望查看的内容、用途和背景。不要填写敏感个人隐私、密钥或机密信息。">
        <Textarea name="reason" required maxLength={1200} className="min-h-40" />
      </Field>
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-7 text-blue-800">
        提交申请不代表一定会授权，也不会自动开放 Documents、私密附件、Storage 路径或临时下载链接。
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="提交中...">提交申请</SubmitButton>
        <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          返回首页
        </Link>
      </div>
    </form>
  );
}
