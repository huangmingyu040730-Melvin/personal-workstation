import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicDocumentAttachmentsPanel } from "@/components/public/public-document-attachments-panel";
import { Progress } from "@/components/progress";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicDocumentsForAsset } from "@/lib/queries/public-document-attachments";
import { getPublicProjectBySlug, getViewableProjectBySlug } from "@/lib/queries/projects";
import { getPublicKnowledgeNotesByProjectId } from "@/lib/queries/knowledge";
import { getPublicPublicationsByProjectId } from "@/lib/queries/publications";
import { publicPageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    return {
      title: "研究项目 | 黄铭语",
      description: "公开研究项目不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: `${project.title} | 黄铭语`,
    description: project.summary,
    path: `/projects/${project.slug}`,
    type: "article"
  });
}

export default async function PublicProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getViewableProjectBySlug(slug);

  if (!project) {
    return (
      <PublicShell>
        <PublicPageHero eyebrow="Restricted Access" title="研究项目需要授权访问" description="这条研究项目可能尚未公开，或需要管理员按邮箱授权后才能查看。" />
        <RestrictedAccessNotice loginHref={`/viewer/login?next=${encodeURIComponent(`/projects/${slug}`)}`} />
      </PublicShell>
    );
  }

  const [relatedPublications, relatedKnowledge, publicDocuments] = await Promise.all([
    getPublicPublicationsByProjectId(project.id, 4),
    getPublicKnowledgeNotesByProjectId(project.id, { limit: 4 }),
    project.visibility === "public" ? getPublicDocumentsForAsset("project", project.id) : Promise.resolve([])
  ]);
  const hasResearchDetails = Boolean(project.background?.trim() || project.research_question?.trim() || project.methodology?.trim());

  return (
    <PublicShell>
      <PublicPageHero eyebrow="Research Project" title={project.title} description={project.summary} />
      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 py-10 lg:grid-cols-[minmax(0,0.98fr)_0.42fr] lg:px-12 2xl:px-16">
        <div className="space-y-5">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            <ArrowLeft size={16} />
            返回公开项目
          </Link>
          {project.background?.trim() ? <Card><CardHeader title="研究背景" /><MarkdownPreview content={project.background} /></Card> : null}
          {project.research_question?.trim() ? <Card><CardHeader title="研究问题" /><MarkdownPreview content={project.research_question} /></Card> : null}
          {project.methodology?.trim() ? <Card><CardHeader title="研究方法" /><MarkdownPreview content={project.methodology} /></Card> : null}
          {!hasResearchDetails ? (
            <Card>
              <CardHeader title="项目说明" />
              <p className="text-sm leading-7 text-stone-600">该项目的公开背景、问题和方法仍在整理中。当前页面先展示已公开的摘要、状态、进度和关联内容。</p>
            </Card>
          ) : null}
          <PublicDocumentAttachmentsPanel attachments={publicDocuments} />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="项目状态" />
            <div className="flex items-center justify-between">
              <StatusBadge status={project.status} />
              <span className="text-sm font-semibold text-navy-950">{project.progress}%</span>
            </div>
            <div className="mt-4">
              <Progress value={project.progress}  />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-stone-500">开始日期</dt><dd className="font-medium text-stone-800">{formatDate(project.start_date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">精选</dt><dd className="font-medium text-stone-800">{project.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">更新</dt><dd className="font-medium text-stone-800">{formatDateTime(project.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {project.tags.length > 0 ? project.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-stone-500">暂无标签</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="公开说明" />
            <p className="text-sm leading-7 text-stone-600">本页只展示公开项目字段。只有显式设为公开、且关联到当前公开项目的文件会出现在公开附件区域；私密文件、Storage 路径和短时链接不会写入页面。</p>
          </Card>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 pb-14 lg:grid-cols-2 lg:px-12 2xl:px-16">
        <Card>
          <CardHeader title="关联公开成果" description="仅展示同项目下已公开的 Publications" />
          <div className="space-y-3">
            {relatedPublications.length > 0 ? relatedPublications.map((publication) => (
              <Link key={publication.id} href={`/publications/${publication.slug}`} className="flex items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4 transition hover:bg-blue-100">
                <div>
                  <p className="font-semibold text-navy-950">{publication.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{publication.summary}</p>
                </div>
                <ArrowRight className="shrink-0 text-blue-700" size={16} />
              </Link>
            )) : <p className="text-sm leading-7 text-stone-500">暂无关联公开成果。</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="关联公开知识文章" description="仅展示同项目下已公开的 Knowledge" />
          <div className="space-y-3">
            {relatedKnowledge.length > 0 ? relatedKnowledge.map((note) => (
              <Link key={note.id} href={`/knowledge/${note.slug}`} className="flex items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4 transition hover:bg-blue-100">
                <div>
                  <p className="font-semibold text-navy-950">{note.title}</p>
                  <p className="mt-1 text-sm text-stone-500">{note.category}</p>
                </div>
                <ArrowRight className="shrink-0 text-blue-700" size={16} />
              </Link>
            )) : <p className="text-sm leading-7 text-stone-500">暂无关联公开知识文章。</p>}
          </div>
        </Card>
      </section>
    </PublicShell>
  );
}
