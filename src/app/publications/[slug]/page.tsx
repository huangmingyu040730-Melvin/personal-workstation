import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicDocumentAttachmentsPanel } from "@/components/public/public-document-attachments-panel";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicKnowledgeNotesByProjectId } from "@/lib/queries/knowledge";
import { getPublicDocumentsForAsset } from "@/lib/queries/public-document-attachments";
import { getPublicPublicationBySlug, getViewablePublicationBySlug } from "@/lib/queries/publications";
import { publicPageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublicPublicationBySlug(slug);

  if (!publication) {
    return {
      title: "学术成果 | 黄铭语",
      description: "公开学术成果不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: `${publication.title} | 黄铭语`,
    description: publication.summary,
    path: `/publications/${publication.slug}`,
    type: "article"
  });
}

export default async function PublicPublicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await getViewablePublicationBySlug(slug);

  if (!publication) {
    return (
      <PublicShell>
        <PublicPageHero eyebrow="Restricted Access" title="学术成果需要授权访问" description="这条学术成果可能尚未公开，或需要管理员按邮箱授权后才能查看。" />
        <RestrictedAccessNotice loginHref={`/viewer/login?next=${encodeURIComponent(`/publications/${slug}`)}`} />
      </PublicShell>
    );
  }

  const [relatedKnowledge, publicDocuments] = await Promise.all([
    publication.project_id
      ? getPublicKnowledgeNotesByProjectId(publication.project_id, { limit: 3 })
      : Promise.resolve([]),
    publication.visibility === "public" ? getPublicDocumentsForAsset("publication", publication.id) : Promise.resolve([])
  ]);

  return (
    <PublicShell>
      <PublicPageHero eyebrow={getPublicationTypeLabel(publication.publication_type)} title={publication.title} description={publication.summary} />
      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 py-10 lg:grid-cols-[minmax(0,0.98fr)_0.38fr] lg:px-12 2xl:px-16">
        <div className="space-y-5">
          <Link href="/publications" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            <ArrowLeft size={16} />
            返回公开成果
          </Link>
          {publication.abstract?.trim() ? <Card><CardHeader title="摘要 / Abstract" /><MarkdownPreview content={publication.abstract} /></Card> : null}
          {!publication.abstract?.trim() ? (
            <Card>
              <CardHeader title="成果简介" />
              <p className="text-sm leading-7 text-stone-600">{publication.summary}</p>
            </Card>
          ) : null}
          <PublicDocumentAttachmentsPanel attachments={publicDocuments} />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="成果信息" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-stone-500">类型</dt><dd className="font-medium text-stone-800">{getPublicationTypeLabel(publication.publication_type)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">发布日期</dt><dd className="font-medium text-stone-800">{formatDate(publication.published_on)}</dd></div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">关联项目</dt>
                <dd className="text-right font-medium text-stone-800">
                  {publication.projects ? <Link href={`/projects/${publication.projects.slug}`} className="text-blue-700 hover:text-blue-800">{publication.projects.title}</Link> : "未公开关联"}
                </dd>
              </div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">精选</dt><dd className="font-medium text-stone-800">{publication.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">更新</dt><dd className="font-medium text-stone-800">{formatDateTime(publication.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {publication.tags.length > 0 ? publication.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-stone-500">暂无标签</p>}
            </div>
          </Card>
        </div>
      </section>
      {relatedKnowledge.length > 0 ? (
        <section className="mx-auto max-w-[1680px] px-5 pb-14 lg:px-12 2xl:px-16">
          <Card>
            <CardHeader title="相关公开知识文章" description="基于同一公开关联项目展示，不包含私密或链接可见内容。" />
            <div className="grid gap-3 md:grid-cols-3">
              {relatedKnowledge.map((note) => (
                <Link key={note.id} href={`/knowledge/${note.slug}`} className="rounded-2xl bg-blue-50 p-4 transition hover:bg-blue-100">
                  <p className="font-semibold text-navy-950">{note.title}</p>
                  <p className="mt-1 text-sm text-stone-500">{note.category}</p>
                  {note.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{note.excerpt}</p> : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">阅读 <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      ) : null}
    </PublicShell>
  );
}
