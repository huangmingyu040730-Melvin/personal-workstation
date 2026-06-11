import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import { MarketBriefMarkdownDraftButton } from "@/components/forms/market-brief-markdown-draft-button";
import { marketBriefGenerationStatuses, marketBriefStatuses } from "@/lib/content-options";
import type { MarketBriefRecord } from "@/lib/content-types";
import { formatDateInputValue } from "@/lib/format";
import { buildMarketBriefMarkdownDraft } from "@/lib/market-brief-markdown";
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
  const markdownDraft = brief ? buildMarketBriefMarkdownDraft(brief) : "";

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
            <Textarea name="data_sources" defaultValue={marketBriefArrayToText(brief?.data_sources)} placeholder="交易所公告、指数公司公开数据、人工复核来源" className="min-h-24" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Markdown 主内容"
        description="如果填写 Markdown 主内容，预览和下载会优先使用该内容；如果留空，系统会根据下方结构化字段自动生成 Markdown。"
      >
        {brief ? (
          <div className="mb-5">
            <MarketBriefMarkdownDraftButton markdown={markdownDraft} />
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="生成状态">
            <Select name="generation_status" defaultValue={brief?.generation_status ?? "manual"}>
              {marketBriefGenerationStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="生成方式 / 维护方式" hint="例如 manual、skill、ai；当前阶段不自动调用外部系统。">
            <TextInput name="generator_name" defaultValue={brief?.generator_name ?? "manual"} placeholder="manual" />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Markdown 内容源" hint="可手工编辑完整研究报告。留空时，站内预览和下载会按结构化字段实时合成。">
            <Textarea
              id="market-brief-markdown-content"
              name="markdown_content"
              defaultValue={brief?.markdown_content ?? ""}
              rows={16}
              placeholder="# A股市场收评简报｜2026-06-10"
              className="font-mono text-[13px] leading-6"
            />
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
  return formatDateInputValue();
}
