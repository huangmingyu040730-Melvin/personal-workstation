import Link from "next/link";
import type { Metadata } from "next";
import { PublicDetailBody, PublicDetailGrid, PublicDetailHero, PublicDetailMetaList, PublicDetailSection, PublicDetailTags, PublicRelatedContent, type PublicDetailChip, type PublicRelatedItem } from "@/components/public/public-detail-shell";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicKnowledgeNoteBySlug, getRelatedPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { getPublicPublicationsByProjectId } from "@/lib/queries/publications";
import { publicMetadataDescription, publicPageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const note = await getPublicKnowledgeNoteBySlug(slug);

  if (!note) {
    return {
      title: "知识文章",
      description: "公开知识文章不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: note.title,
    description: publicMetadataDescription(note.excerpt ?? note.content, "黄铭语研究工作站中的公开知识文章。"),
    path: `/knowledge/${note.slug}`,
    type: "article"
  });
}

export default async function PublicKnowledgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getPublicKnowledgeNoteBySlug(slug);

  if (!note) {
    return (
      <PublicShell>
        <PublicPageHero eyebrow="Access Request" title="知识文章暂未公开" description="这篇知识文章可能尚未公开，或需要管理员按邮箱授权后才能查看。公开页面不会泄露受限正文或附件。" />
        <RestrictedAccessNotice loginHref={`/viewer/login?next=${encodeURIComponent(`/knowledge/${slug}`)}`} />
      </PublicShell>
    );
  }

  const [relatedNotes, relatedPublications] = await Promise.all([
    getRelatedPublicKnowledgeNotes(note, 4),
    note.project_id ? getPublicPublicationsByProjectId(note.project_id, 4) : Promise.resolve([])
  ]);
  const heroChips: PublicDetailChip[] = [
    { label: note.category, tone: "blue" },
    { label: note.is_featured ? "精选知识" : "公开知识", tone: note.is_featured ? "violet" : "slate" },
    ...note.tags.slice(0, 3).map((tag) => ({ label: tag, tone: "slate" as const }))
  ];
  const relatedNoteItems: PublicRelatedItem[] = relatedNotes.map((item) => ({
    href: `/knowledge/${item.slug}`,
    title: item.title,
    meta: item.category,
    description: item.excerpt,
    ctaLabel: "继续阅读"
  }));
  const relatedPublicationItems: PublicRelatedItem[] = relatedPublications.map((publication) => ({
    href: `/publications/${publication.slug}`,
    title: publication.title,
    meta: getPublicationTypeLabel(publication.publication_type),
    description: publication.summary,
    ctaLabel: "查看成果"
  }));

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Knowledge Note"
        title={note.title}
        description={note.excerpt ?? "公开知识文章"}
        chips={heroChips}
        backHref="/knowledge"
        backLabel="返回公开知识库"
      />
      <PublicDetailBody>
        <PublicDetailGrid
          main={(
            <>
              <PublicDetailSection title="正文" description="公开可阅读的知识笔记内容。">
                {note.content?.trim() ? <MarkdownPreview content={note.content} /> : note.excerpt?.trim() ? <p className="text-sm leading-7 text-slate-600">{note.excerpt}</p> : <p className="text-sm leading-7 text-slate-600">该知识文章的公开正文仍在整理中。</p>}
              </PublicDetailSection>
            </>
          )}
          aside={(
            <>
              <PublicDetailSection title="文章信息">
                <PublicDetailMetaList
                  items={[
                    { label: "分类", value: note.category },
                    {
                      label: "关联项目",
                      value: note.projects ? (
                        <Link href={`/projects/${note.projects.slug}`} className="text-blue-700 hover:text-blue-800">
                          {note.projects.title}
                        </Link>
                      ) : "未公开关联"
                    },
                    { label: "精选", value: note.is_featured ? "是" : "否" },
                    { label: "更新", value: formatDateTime(note.updated_at) }
                  ]}
                />
              </PublicDetailSection>
              <PublicDetailSection title="标签">
                <PublicDetailTags tags={note.tags} />
              </PublicDetailSection>
              <PublicDetailSection title="公开可见性">
                <p className="text-sm leading-7 text-slate-600">
                  本页只展示已公开的知识字段，不展示文件附件、内部文件地址、临时下载地址、后台关系管理或内部附件信息。
                </p>
                <Link href="/access-request" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                  申请查看未公开材料
                </Link>
              </PublicDetailSection>
            </>
          )}
        />
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <PublicRelatedContent
            title="相关公开知识"
            description="优先展示同项目或同分类下的公开知识文章。"
            items={relatedNoteItems}
            emptyText="暂无相关公开知识文章。"
            browseHref="/knowledge"
            browseLabel="浏览知识库"
          />
          <PublicRelatedContent
            title="相关公开成果"
            description="若知识文章关联到公开项目，这里只展示同项目下已公开的成果。"
            items={relatedPublicationItems}
            emptyText="暂无相关公开成果。"
            browseHref="/publications"
            browseLabel="浏览公开成果"
          />
        </div>
      </PublicDetailBody>
    </PublicShell>
  );
}
