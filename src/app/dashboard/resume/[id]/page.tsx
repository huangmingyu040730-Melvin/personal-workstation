import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Link2, MapPin } from "lucide-react";
import { deleteResumeItemAction } from "@/actions/resume";
import { AppShell } from "@/components/app-shell";
import { AdminDangerZone, AdminPageSurface } from "@/components/admin-ui";
import { Badge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getResumeItemTypeLabel } from "@/lib/content-options";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { MarkdownPreview } from "@/lib/markdown";
import { getResumeItemById, getResumeItemRelation, getResumeRelationOptions } from "@/lib/queries/resume";

export default async function ResumeItemDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, relationOptions] = await Promise.all([params, searchParams, getResumeRelationOptions()]);
  const item = await getResumeItemById(id);

  if (!item) {
    notFound();
  }

  const relation = getResumeItemRelation(item, relationOptions);
  const deleteAction = deleteResumeItemAction.bind(null, item.id);
  const error = getFormError(query);
  const detailEntries = getDetailEntries(item.details);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Resume Detail"
          title={item.title}
          description="结构化履历素材详情。后续简历生成器会从这些素材中选择、组合和排序。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/resume/${item.id}/edit`} className="rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">编辑</Link>
              <Link href="/dashboard/resume" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">返回素材库</Link>
            </div>
          }
        />
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader title="素材概述" />
              <MarkdownPreview content={item.summary} emptyText="尚未填写简要概述。" />
            </Card>

            <Card>
              <CardHeader title="Bullet points" />
              {item.bullets.length > 0 ? (
                <ul className="space-y-3 text-sm leading-7 text-slate-700">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-2xl bg-slate-50 p-3">· {bullet}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">尚未填写 bullet。</p>
              )}
            </Card>

            <Card>
              <CardHeader title="结构化字段" />
              {detailEntries.length > 0 ? (
                <dl className="grid gap-3 md:grid-cols-2">
                  {detailEntries.map((entry) => (
                    <InfoRow key={entry.label} label={entry.label} value={entry.value} />
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">尚未填写教育、个人信息、项目方法或技能分类等结构化字段。</p>
              )}
            </Card>

            <AdminDangerZone description="删除素材会移除这条履历数据库记录，不会影响关联项目、成果、知识文章或 Skill。">
              <form action={deleteAction}>
                <DeleteButton label="删除素材" />
              </form>
            </AdminDangerZone>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="基础属性" action={<VisibilityBadge visibility={item.visibility} />} />
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getResumeItemTypeLabel(item.item_type)}</Badge>
                {item.is_featured ? <Badge className="bg-violet-50 text-violet-700 ring-violet-100">重点素材</Badge> : null}
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow label="机构" value={item.organization || "未设置"} />
                <InfoRow label="角色" value={item.role_title || "未设置"} />
                <InfoRow label="地点" value={item.location || "未设置"} icon={<MapPin size={16} />} />
                <InfoRow label="时间" value={formatResumeDateRange(item)} icon={<CalendarDays size={16} />} />
                <InfoRow label="排序" value={String(item.sort_order)} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="技能与标签" />
              <TokenBlock label="技能" items={item.skills} />
              <TokenBlock label="标签" items={item.tags} />
            </Card>

            <Card>
              <CardHeader title="关联对象" action={<Link2 size={18} className="text-blue-700" />} />
              {relation ? (
                <Link href={relation.href} className="block rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm transition hover:bg-white">
                  <p className="font-semibold text-blue-800">{relation.label}</p>
                  <p className="mt-1 text-slate-700">{relation.title}</p>
                </Link>
              ) : (
                <p className="text-sm text-slate-500">未关联现有内容资产。</p>
              )}
            </Card>

            <Card>
              <CardHeader title="记录信息" />
              <dl className="space-y-3 text-sm">
                <InfoRow label="创建时间" value={formatDateTime(item.created_at)} />
                <InfoRow label="更新时间" value={`${formatDateTime(item.updated_at)} · ${formatRelative(item.updated_at)}`} />
              </dl>
            </Card>
          </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="flex items-center gap-2 text-slate-500">{icon}{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function TokenBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item}</span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">未填写。</p>
      )}
    </div>
  );
}

function getDetailEntries(details: Record<string, unknown>) {
  const labelMap: Record<string, string> = {
    photo_url: "照片 URL",
    gender: "性别",
    age: "年龄",
    phone: "电话",
    email: "邮箱",
    website: "个人链接",
    direction: "方向",
    school: "学校",
    college: "学院",
    major: "专业",
    degree: "学位",
    gpa: "GPA",
    core_courses: "核心课程",
    honors: "荣誉",
    company: "公司",
    department: "部门",
    position: "岗位",
    business_area: "业务方向",
    organization_name: "组织名称",
    project_role: "项目角色",
    background: "背景",
    methods: "方法",
    tools: "工具",
    topic: "研究主题",
    conclusion: "结论",
    skill_category: "技能分类",
    skill_items: "技能条目",
    issuer: "颁发方",
    issued_at: "获得时间",
    description: "说明"
  };

  return Object.entries(details ?? {})
    .map(([key, value]) => {
      const rendered = Array.isArray(value) ? value.join("、") : typeof value === "string" ? value : "";
      return rendered ? { label: labelMap[key] ?? key, value: rendered } : null;
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));
}

function formatResumeDateRange(item: { start_date: string | null; end_date: string | null; is_current: boolean }) {
  const start = item.start_date ?? "未设置";
  const end = item.is_current ? "至今" : item.end_date ?? "未设置";
  return `${start} - ${end}`;
}
