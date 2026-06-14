import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/badge";
import { Progress } from "@/components/progress";
import { PublicDetailBody, PublicDetailGrid, PublicDetailHero, PublicDetailMetaList, PublicDetailSection, PublicDetailTags, PublicRelatedContent, type PublicDetailChip, type PublicRelatedItem } from "@/components/public/public-detail-shell";
import { PublicDocumentAttachmentsPanel } from "@/components/public/public-document-attachments-panel";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { buildAccessRequestHref } from "@/lib/access-request-context";
import { getPublicationTypeLabel, projectStatuses } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicKnowledgeNotesByProjectId } from "@/lib/queries/knowledge";
import { getPublicDocumentsForAsset } from "@/lib/queries/public-document-attachments";
import { getPublicProjectBySlug, getViewableProjectBySlug } from "@/lib/queries/projects";
import { getPublicPublicationsByProjectId } from "@/lib/queries/publications";
import { publicMetadataDescription, publicNoindexMetadata, publicPageMetadata } from "@/lib/site";

function getProjectStatusLabel(value: string) {
  return projectStatuses.find((status) => status.value === value)?.label ?? value;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    return publicNoindexMetadata({
      title: "研究项目",
      description: "公开研究项目不存在或未公开。",
      path: `/projects/${slug}`
    });
  }

  return publicPageMetadata({
    title: project.title,
    description: publicMetadataDescription(project.summary),
    path: `/projects/${project.slug}`,
    type: "article"
  });
}

export default async function PublicProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getViewableProjectBySlug(slug);

  if (!project) {
    const requestHref = buildAccessRequestHref({ contentType: "project", slug, from: "project_restricted" });

    return (
      <PublicShell>
        <PublicPageHero eyebrow="Access Request" title="该内容暂未公开或需要授权访问" description="当前公开页面无法显示这项研究内容。公开站点不会泄露未公开正文、附件、内部关系或文件内部信息。" />
        <RestrictedAccessNotice
          requestHref={requestHref}
          loginHref={`/viewer/login?next=${encodeURIComponent(`/projects/${slug}`)}`}
          backHref="/projects"
          backLabel="返回公开项目"
        />
      </PublicShell>
    );
  }

  const [relatedPublications, relatedKnowledge, publicDocuments] = await Promise.all([
    getPublicPublicationsByProjectId(project.id, 4),
    getPublicKnowledgeNotesByProjectId(project.id, { limit: 4 }),
    project.visibility === "public" ? getPublicDocumentsForAsset("project", project.id) : Promise.resolve([])
  ]);
  const statusLabel = getProjectStatusLabel(project.status);
  const isRestrictedView = project.visibility === "restricted";
  const heroChips: PublicDetailChip[] = [
    { label: statusLabel, tone: "blue" },
    { label: `${isRestrictedView ? "授权进度" : "公开进度"} ${project.progress}%`, tone: "green" },
    { label: isRestrictedView ? "授权项目" : project.is_featured ? "精选项目" : "公开项目", tone: isRestrictedView ? "slate" : project.is_featured ? "violet" : "slate" },
    ...project.tags.slice(0, 3).map((tag) => ({ label: tag, tone: "slate" as const }))
  ];
  const publicationItems: PublicRelatedItem[] = relatedPublications.map((publication) => ({
    href: `/publications/${publication.slug}`,
    title: publication.title,
    meta: getPublicationTypeLabel(publication.publication_type),
    description: publication.summary,
    ctaLabel: "查看成果"
  }));
  const knowledgeItems: PublicRelatedItem[] = relatedKnowledge.map((note) => ({
    href: `/knowledge/${note.slug}`,
    title: note.title,
    meta: note.category,
    description: note.excerpt,
    ctaLabel: "阅读"
  }));
  const accessRequestHref = buildAccessRequestHref({
    contentType: "project",
    slug: project.slug,
    title: project.title,
    from: "project_detail"
  });

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Research Project"
        title={project.title}
        description={project.summary}
        chips={heroChips}
        backHref="/projects"
        backLabel="返回公开项目"
        accessHref={accessRequestHref}
      />
      <PublicDetailBody>
        <PublicDetailGrid
          main={(
            <>
              <PublicDetailSection title="研究问题" description="这个项目试图回答的核心问题。">
                {project.research_question?.trim() ? <MarkdownPreview content={project.research_question} /> : <p className="text-sm leading-7 text-slate-600">公开研究问题仍在整理中，当前先以项目摘要和相关公开内容作为说明。</p>}
              </PublicDetailSection>
              <PublicDetailSection title="研究背景" description="研究起点、问题语境与资料边界。">
                {project.background?.trim() ? <MarkdownPreview content={project.background} /> : <p className="text-sm leading-7 text-slate-600">暂无单独公开背景说明。</p>}
              </PublicDetailSection>
              <PublicDetailSection title="方法与路径" description="公开层面的研究方法、分析框架或执行路径。">
                {project.methodology?.trim() ? <MarkdownPreview content={project.methodology} /> : <p className="text-sm leading-7 text-slate-600">暂无单独公开方法说明。</p>}
              </PublicDetailSection>
              <PublicDocumentAttachmentsPanel
                attachments={publicDocuments}
                title="公开项目附件"
                description={isRestrictedView ? "restricted 授权只开放正文内容；附件不会随授权开放。" : "仅展示已显式设为公开、且关联到当前公开项目的文件。"}
              />
            </>
          )}
          aside={(
            <>
              <PublicDetailSection title="项目状态">
                <div className="flex items-center justify-between gap-4">
                  <StatusBadge status={project.status} />
                  <span className="text-sm font-semibold text-navy-950">{project.progress}%</span>
                </div>
                <div className="mt-4">
                  <Progress value={project.progress} />
                </div>
                <div className="mt-5">
                  <PublicDetailMetaList
                    items={[
                      { label: "开始日期", value: formatDate(project.start_date) },
                      { label: "精选", value: project.is_featured ? "是" : "否" },
                      { label: "更新", value: formatDateTime(project.updated_at) }
                    ]}
                  />
                </div>
              </PublicDetailSection>
              <PublicDetailSection title="标签">
                <PublicDetailTags tags={project.tags} />
              </PublicDetailSection>
              <PublicDetailSection title="访问边界">
                <p className="text-sm leading-7 text-slate-600">
                  {isRestrictedView
                    ? "本页对当前已授权邮箱展示 restricted 项目正文。授权不开放 Documents、私密附件、内部文件地址、内部关系记录或临时下载地址。"
                    : "本页只展示已公开的项目字段。公开附件必须同时满足文件公开、当前项目公开、文件关联当前项目三个条件；私密文件、内部文件地址、内部关系记录和临时下载地址不会写入页面。"}
                </p>
                <Link href={accessRequestHref} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                  申请查看未公开材料
                </Link>
              </PublicDetailSection>
            </>
          )}
        />
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <PublicRelatedContent
            title="相关公开成果"
            description="仅展示同项目下已公开的 Publications。"
            items={publicationItems}
            emptyText="暂无关联公开成果。"
            browseHref="/publications"
            browseLabel="浏览公开成果"
          />
          <PublicRelatedContent
            title="相关公开知识"
            description="仅展示同项目下已公开的 Knowledge。"
            items={knowledgeItems}
            emptyText="暂无关联公开知识文章。"
            browseHref="/knowledge"
            browseLabel="浏览知识库"
          />
        </div>
      </PublicDetailBody>
    </PublicShell>
  );
}
