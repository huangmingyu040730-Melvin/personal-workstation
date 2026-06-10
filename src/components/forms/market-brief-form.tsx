import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import { marketBriefStatuses } from "@/lib/content-options";
import type { MarketBriefRecord } from "@/lib/content-types";
import { marketBriefArrayToText, marketBriefContentFields } from "@/lib/market-briefs";
import { Checkbox, ErrorNotice, Field, Select, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function MarketBriefForm({
  action,
  brief,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  brief?: MarketBriefRecord | null;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <ErrorNotice message={error} />

      <AdminFormSection title="基础信息" description="用于后台列表、详情页和 Dashboard 最近市场简报展示。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="日期">
            <TextInput name="brief_date" type="date" defaultValue={brief?.brief_date ?? getTodayDate()} required />
          </Field>
          <Field label="标题">
            <TextInput name="title" defaultValue={brief?.title ?? ""} placeholder="例如 A 股每日市场收评 2026-06-10" required />
          </Field>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Field label="市场">
            <TextInput name="market" defaultValue={brief?.market ?? "A股"} placeholder="例如 A股、港股、美股、全球市场" required />
          </Field>
          <Field label="状态">
            <Select name="status" defaultValue={brief?.status ?? "draft"}>
              {marketBriefStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Checkbox name="is_featured" label="精选简报" defaultChecked={brief?.is_featured ?? false} />
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="标签" hint="支持逗号、中文逗号或换行分隔，保存时会自动 trim 并过滤空项。">
            <Textarea name="tags" defaultValue={marketBriefArrayToText(brief?.tags)} placeholder="A股、市场收评、量化观察" className="min-h-24" />
          </Field>
          <Field label="数据来源" hint="仅记录来源名称或公开链接说明，不保存 API Key。">
            <Textarea name="data_sources" defaultValue={marketBriefArrayToText(brief?.data_sources)} placeholder="东方财富、交易所公告、指数公司公开数据" className="min-h-24" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="内容模块" description="本阶段只支持手工录入，不自动抓取行情、不调用 AI、不发送邮件。">
        <div className="space-y-5">
          {marketBriefContentFields.map((field) => {
            const value = brief?.[field.key];

            return (
              <Field key={field.key} label={field.label} hint={field.description}>
                <Textarea name={field.key} defaultValue={typeof value === "string" ? value : ""} rows={field.key === "summary" ? 5 : 8} />
              </Field>
            );
          })}
        </div>
      </AdminFormSection>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton />
        <Link href={brief ? `/dashboard/market-briefs/${brief.id}` : "/dashboard/market-briefs"} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          取消
        </Link>
      </div>
    </form>
  );
}

function getTodayDate() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}
