import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicContentGuidance } from "@/components/dashboard/public-content-guidance";
import { PageHeader } from "@/components/page-header";
import { getPublicationTypeLabel, publicationTypes, visibilityOptions } from "@/lib/content-options";
import { formatDate, formatRelative } from "@/lib/format";
import { getPublications } from "@/lib/queries/publications";

export default async function PublicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const publicationType = params.type ?? "all";
  const visibility = params.visibility ?? "all";
  const q = params.q ?? "";
  const publications = await getPublications({ publicationType, visibility, q });

  return (
    <AppShell>
      <AdminPageSurface>
      <PageHeader
        eyebrow="Publications"
        title="学术成果"
        description="从 Supabase 读取真实成果数据，管理研究报告、论文、策略报告与发布权限。"
        action={<Link href="/dashboard/publications/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800"><Plus size={16} />新建成果</Link>}
      />
      <PublicContentGuidance variant="publication" />
      <AdminSection>
      <form className="grid gap-3 lg:grid-cols-[0.35fr_0.35fr_1fr_auto]">
        <select name="type" defaultValue={publicationType} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部类型</option>
          {publicationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        <select name="visibility" defaultValue={visibility} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部权限</option>
          {visibilityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <input name="q" defaultValue={q} placeholder="搜索标题、简介、摘要或标签..." className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
      </form>
      </AdminSection>
      <Card>
        <CardHeader title="成果列表" description="默认按发布日期与更新时间排序" />
        {publications.length === 0 ? (
          <AdminEmptyState title="还没有学术成果" description="创建第一条成果后，Dashboard 与公开首页会读取真实数据。" action={<Link href="/dashboard/publications/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建成果</Link>} />
        ) : (
          <div className="space-y-3">
            {publications.map((publication) => (
              <Link key={publication.id} href={`/dashboard/publications/${publication.id}`} className="admin-card-motion flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
                <div className="flex gap-3">
                  <FileText className="mt-1 shrink-0 text-blue-700" size={18} />
                  <div>
                    <p className="font-medium text-slate-900">{publication.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {getPublicationTypeLabel(publication.publication_type)} · {formatDate(publication.published_on)} · 更新于 {formatRelative(publication.updated_at)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{publication.summary}</p>
                  </div>
                </div>
                <VisibilityBadge visibility={publication.visibility} />
              </Link>
            ))}
          </div>
        )}
      </Card>
      </AdminPageSurface>
    </AppShell>
  );
}
