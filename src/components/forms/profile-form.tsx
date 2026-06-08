import Link from "next/link";
import { AdminFormSection } from "@/components/admin-ui";
import type { ProfileRecord } from "@/lib/content-types";
import { Checkbox, ErrorNotice, Field, Textarea, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

function keyValueText(value: Record<string, string> | null | undefined) {
  return Object.entries(value ?? {})
    .map(([key, itemValue]) => `${key}: ${itemValue}`)
    .join("\n");
}

function arrayText(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

export function ProfileForm({
  action,
  profile,
  error,
  saved
}: {
  action: (formData: FormData) => void | Promise<void>;
  profile?: ProfileRecord | null;
  error?: string;
  saved?: boolean;
}) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={profile?.id ?? ""} />
      <ErrorNotice message={error} />
      {saved ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          个人资料已保存，公开 About 页面会读取最新公开字段。
        </div>
      ) : null}

      <AdminFormSection title="公开身份" description="用于 About 页面、公开研究工作站中的基础身份展示。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="公开姓名">
            <TextInput name="display_name" defaultValue={profile?.display_name ?? ""} required />
          </Field>
          <Field label="一句话定位 / headline">
            <TextInput name="headline" defaultValue={profile?.headline ?? ""} placeholder="投资研究、量化分析与 AI 工作流探索者" />
          </Field>
          <Field label="当前角色">
            <TextInput name="role_title" defaultValue={profile?.role_title ?? ""} placeholder="学生｜金融研究｜量化策略｜AI 辅助研究" />
          </Field>
          <Field label="所在机构 / 组织">
            <TextInput name="organization" defaultValue={profile?.organization ?? ""} />
          </Field>
          <Field label="所在地">
            <TextInput name="location" defaultValue={profile?.location ?? ""} />
          </Field>
          <Field label="头像 URL">
            <TextInput name="avatar_url" defaultValue={profile?.avatar_url ?? ""} placeholder="可选，后续可接入 Storage" />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="简介与背景" description="这些内容会影响公开 About 页面，请保持克制、真实和可公开。">
        <Field label="个人简介">
          <Textarea name="bio" defaultValue={profile?.bio ?? ""} rows={5} />
        </Field>
        <Field label="教育背景">
          <Textarea name="education" defaultValue={profile?.education ?? ""} rows={3} />
        </Field>
      </AdminFormSection>

      <AdminFormSection title="研究方向与技能标签" description="用逗号或换行分隔，公开页面会以标签形式展示。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="研究方向">
            <Textarea name="research_interests" defaultValue={arrayText(profile?.research_interests)} />
          </Field>
          <Field label="技能标签">
            <Textarea name="skill_tags" defaultValue={arrayText(profile?.skill_tags)} />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="公开联系方式与链接" description="只填写愿意公开展示的信息。每行使用“名称: 内容”的格式。">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="公开联系方式" hint="例如：邮箱: hello@example.com">
            <Textarea name="contact" defaultValue={keyValueText(profile?.contact)} />
          </Field>
          <Field label="社交链接" hint="例如：GitHub: https://github.com/your-name">
            <Textarea name="social_links" defaultValue={keyValueText(profile?.social_links)} />
          </Field>
        </div>
      </AdminFormSection>

      <AdminFormSection title="公开展示设置" description="关闭后 About 页面不会读取这条 Profile 的公开字段。">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Checkbox name="is_public" label="允许在公开 About 页面展示" defaultChecked={profile?.is_public && profile.visibility === "public"} />
          <p className="text-sm leading-6 text-slate-500">保存后会同步设置 visibility 为 public 或 private。</p>
        </div>
      </AdminFormSection>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton>保存个人资料</SubmitButton>
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          返回工作台
        </Link>
      </div>
    </form>
  );
}
