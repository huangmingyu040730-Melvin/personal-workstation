import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { Progress } from "@/components/progress";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicProjectBySlug } from "@/lib/queries/projects";

export default async function PublicProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <PublicShell>
      <PublicPageHero eyebrow="Research Project" title={project.title} description={project.summary} />
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-8 lg:grid-cols-[1fr_0.42fr] lg:px-8">
        <div className="space-y-5">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
            <ArrowLeft size={16} />
            返回公开项目
          </Link>
          <Card>
            <CardHeader title="研究背景" />
            <MarkdownPreview content={project.background} emptyText="暂无公开研究背景。" />
          </Card>
          <Card>
            <CardHeader title="研究问题" />
            <MarkdownPreview content={project.research_question} emptyText="暂无公开研究问题。" />
          </Card>
          <Card>
            <CardHeader title="研究方法" />
            <MarkdownPreview content={project.methodology} emptyText="暂无公开研究方法。" />
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="项目状态" />
            <div className="flex items-center justify-between">
              <StatusBadge status={project.status} />
              <span className="text-sm font-semibold text-slate-900">{project.progress}%</span>
            </div>
            <div className="mt-4">
              <Progress value={project.progress} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">开始日期</dt><dd className="font-medium text-slate-800">{formatDate(project.start_date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{project.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(project.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {project.tags.length > 0 ? project.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{tag}</span>) : <p className="text-sm text-slate-500">暂无标签</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="公开说明" />
            <p className="text-sm leading-7 text-slate-600">本页只展示公开项目字段，不包含私密笔记、内部日志或文件附件。</p>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
