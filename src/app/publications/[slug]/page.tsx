import Link from "next/link";
import type { Metadata } from "next";
import { PublicDetailBody, PublicDetailGrid, PublicDetailHero, PublicDetailMetaList, PublicDetailSection, PublicDetailTags, PublicRelatedContent, type PublicDetailChip, type PublicRelatedItem } from "@/components/public/public-detail-shell";
import { PublicDocumentAttachmentsPanel } from "@/components/public/public-document-attachments-panel";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { buildAccessRequestHref } from "@/lib/access-request-context";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicKnowledgeNotesByProjectId } from "@/lib/queries/knowledge";
import { getPublicDocumentsForAsset } from "@/lib/queries/public-document-attachments";
import { getPublicPublicationBySlug } from "@/lib/queries/publications";
import { publicMetadataDescription, publicPageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublicPublicationBySlug(slug);

  if (!publication) {
    return {
      title: "学术成果",
      description: "公开学术成果不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: publication.title,
    description: publicMetadataDescription(publication.summary || publication.abstract),
    path: `/publications/${publication.slug}`,
    type: "article"
  });
}

export default async function PublicPublicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await getPublicPublicationBySlug(slug);

  if (!publication) {
    const requestHref = buildAccessRequestHref({ contentType: "publication", slug, from: "publication_restricted" });

    return (
      <PublicShell>
        <PublicPageHero eyebrow="Access Request" title="该内容暂未公开或需要授权访问" description="当前公开页面无法显示这项研究内容。公开站点不会泄露未公开正文、附件、内部关系或 Storage 信息。" />
        <RestrictedAccessNotice
          requestHref={requestHref}
          loginHref={`/viewer/login?next=${encodeURIComponent(`/publications/${slug}`)}`}
          backHref="/publications"
          backLabel="返回公开成果"
        />
      </PublicShell>
    );
  }

  const [relatedKnowledge, publicDocuments] = await Promise.all([
    publication.project_id
      ? getPublicKnowledgeNotesByProjectId(publication.project_id, { limit: 4 })
      : Promise.resolve([]),
    getPublicDocumentsForAsset("publication", publication.id)
  ]);
  const publicationTypeLabel = getPublicationTypeLabel(publication.publication_type);
  const heroChips: PublicDetailChip[] = [
    { label: publicationTypeLabel, tone: "blue" },
    { label: publication.published_on ? `发布于 ${formatDate(publication.published_on)}` : "发布日期未设置", tone: "slate" },
    { label: publication.is_featured ? "精选成果" : "公开成果", tone: publication.is_featured ? "violet" : "slate" },
    ...publication.tags.slice(0, 3).map((tag) => ({ label: tag, tone: "slate" as const }))
  ];
  const relatedKnowledgeItems: PublicRelatedItem[] = relatedKnowledge.map((note) => ({
    href: `/knowledge/${note.slug}`,
    title: note.title,
    meta: note.category,
    description: note.excerpt,
    ctaLabel: "阅读"
  }));
  const accessRequestHref = buildAccessRequestHref({
    contentType: "publication",
    slug: publication.slug,
    title: publication.title,
    from: "publication_detail"
  });

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Publication"
        title={publication.title}
        description={publication.summary}
        chips={heroChips}
        backHref="/publications"
        backLabel="返回公开成果"
        accessHref={accessRequestHref}
      />
      <PublicDetailBody>
        <PublicDetailGrid
          main={(
            <>
              <PublicDetailSection title="成果摘要" description="面向公开读者的研究成果概览。">
                {publication.abstract?.trim() ? <MarkdownPreview content={publication.abstract} /> : <p className="text-sm leading-7 text-slate-600">{publication.summary}</p>}
              </PublicDetailSection>
              {publication.abstract?.trim() && publication.summary?.trim() ? (
                <PublicDetailSection title="简介" description="用于快速理解成果背景与贡献。">
                  <p className="text-sm leading-7 text-slate-600">{publication.summary}</p>
                </PublicDetailSection>
              ) : null}
              <PublicDocumentAttachmentsPanel
                attachments={publicDocuments}
                title="公开成果附件"
                description="仅展示已显式设为公开、且关联到当前公开成果的文件。"
              />
            </>
          )}
          aside={(
            <>
              <PublicDetailSection title="成果信息">
                <PublicDetailMetaList
                  items={[
                    { label: "类型", value: publicationTypeLabel },
                    { label: "发布日期", value: formatDate(publication.published_on) },
                    {
                      label: "关联项目",
                      value: publication.projects ? (
                        <Link href={`/projects/${publication.projects.slug}`} className="text-blue-700 hover:text-blue-800">
                          {publication.projects.title}
                        </Link>
                      ) : "未公开关联"
                    },
                    { label: "精选", value: publication.is_featured ? "是" : "否" },
                    { label: "更新", value: formatDateTime(publication.updated_at) }
                  ]}
                />
              </PublicDetailSection>
              <PublicDetailSection title="标签">
                <PublicDetailTags tags={publication.tags} />
              </PublicDetailSection>
              <PublicDetailSection title="公开可见性">
                <p className="text-sm leading-7 text-slate-600">
                  本页不展示历史附件字段、内部文件地址、存储桶信息、内部附件关系或临时下载地址。公开附件下载只通过安全路由按需短时生成。
                </p>
                <Link href={accessRequestHref} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                  申请查看未公开材料
                </Link>
              </PublicDetailSection>
            </>
          )}
        />
        <div className="mt-6">
          <PublicRelatedContent
            title="相关公开知识"
            description="优先展示同一公开项目下的知识笔记，不包含私密或受限内容。"
            items={relatedKnowledgeItems}
            emptyText="暂无关联公开知识文章。"
            browseHref="/knowledge"
            browseLabel="浏览知识库"
          />
        </div>
      </PublicDetailBody>
    </PublicShell>
  );
}
