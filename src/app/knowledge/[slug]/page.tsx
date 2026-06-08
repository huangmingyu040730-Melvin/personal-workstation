import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicKnowledgeNoteBySlug, getViewableKnowledgeNoteBySlug, getRelatedPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { publicPageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const note = await getPublicKnowledgeNoteBySlug(slug);

  if (!note) {
    return {
      title: "知识文章 | 黄铭语",
      description: "公开知识文章不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: `${note.title} | 黄铭语`,
    description: note.excerpt ?? "黄铭语公开研究工作站中的知识文章。",
    path: `/knowledge/${note.slug}`,
    type: "article"
  });
}

export default async function PublicKnowledgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getViewableKnowledgeNoteBySlug(slug);

  if (!note) {
    return (
      <PublicShell>
        <PublicPageHero eyebrow="Restricted Access" title="知识文章需要授权访问" description="这篇知识文章可能尚未公开，或需要管理员按邮箱授权后才能查看。" />
        <RestrictedAccessNotice loginHref={`/viewer/login?next=${encodeURIComponent(`/knowledge/${slug}`)}`} />
      </PublicShell>
    );
  }

  const relatedNotes = await getRelatedPublicKnowledgeNotes(note, 3);

  return (
    <PublicShell>
      <PublicPageHero eyebrow={note.category} title={note.title} description={note.excerpt ?? "公开知识文章"} />
      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 py-10 lg:grid-cols-[minmax(0,0.98fr)_0.35fr] lg:px-12 2xl:px-16">
        <div className="space-y-5">
          <Link href="/knowledge" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            <ArrowLeft size={16} />
            返回公开知识库
          </Link>
          {note.content?.trim() ? <Card><CardHeader title="正文" /><MarkdownPreview content={note.content} /></Card> : null}
          {!note.content?.trim() && note.excerpt?.trim() ? (
            <Card>
              <CardHeader title="摘要" />
              <p className="text-sm leading-7 text-stone-600">{note.excerpt}</p>
            </Card>
          ) : null}
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="文章信息" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-stone-500">分类</dt><dd className="font-medium text-stone-800">{note.category}</dd></div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">关联项目</dt>
                <dd className="text-right font-medium text-stone-800">
                  {note.projects ? <Link href={`/projects/${note.projects.slug}`} className="text-blue-700 hover:text-blue-800">{note.projects.title}</Link> : "未公开关联"}
                </dd>
              </div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">更新</dt><dd className="font-medium text-stone-800">{formatDateTime(note.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {note.tags.length > 0 ? note.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-stone-500">暂无标签</p>}
            </div>
          </Card>
        </div>
      </section>
      {relatedNotes.length > 0 ? (
        <section className="mx-auto max-w-[1680px] px-5 pb-14 lg:px-12 2xl:px-16">
          <Card>
            <CardHeader title="相关公开知识文章" description="优先展示同项目或同分类的公开文章。" />
            <div className="grid gap-3 md:grid-cols-3">
              {relatedNotes.map((item) => (
                <Link key={item.id} href={`/knowledge/${item.slug}`} className="rounded-2xl bg-blue-50 p-4 transition hover:bg-blue-100">
                  <p className="font-semibold text-navy-950">{item.title}</p>
                  <p className="mt-1 text-sm text-stone-500">{item.category}</p>
                  {item.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{item.excerpt}</p> : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">继续阅读 <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      ) : null}
    </PublicShell>
  );
}
