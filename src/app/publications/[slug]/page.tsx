import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicPublicationBySlug } from "@/lib/queries/publications";

export default async function PublicPublicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await getPublicPublicationBySlug(slug);

  if (!publication) {
    notFound();
  }

  return (
    <PublicShell>
      <PublicPageHero eyebrow={getPublicationTypeLabel(publication.publication_type)} title={publication.title} description={publication.summary} />
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-8 lg:grid-cols-[1fr_0.38fr] lg:px-8">
        <div className="space-y-5">
          <Link href="/publications" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
            <ArrowLeft size={16} />
            返回公开成果
          </Link>
          <Card>
            <CardHeader title="摘要 / Abstract" />
            <MarkdownPreview content={publication.abstract} emptyText="暂无公开摘要。" />
          </Card>
          <Card>
            <CardHeader title="附件说明" />
            <p className="text-sm leading-7 text-slate-600">公开成果页面不提供附件下载。关联文件仍为私密资料，仅管理员可在后台通过短时链接访问。</p>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="成果信息" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">类型</dt><dd className="font-medium text-slate-800">{getPublicationTypeLabel(publication.publication_type)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">发布日期</dt><dd className="font-medium text-slate-800">{formatDate(publication.published_on)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">关联项目</dt><dd className="font-medium text-slate-800">{publication.projects?.title ?? "未公开关联"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{publication.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(publication.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {publication.tags.length > 0 ? publication.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-slate-500">暂无标签</p>}
            </div>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
