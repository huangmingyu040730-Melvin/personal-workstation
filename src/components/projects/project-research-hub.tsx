import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Edit3,
  FileText,
  FolderArchive,
  Library,
  Search,
  Upload
} from "lucide-react";
import { AdminEmptyState } from "@/components/admin-ui";
import { AssetLinksPanel } from "@/components/asset-links/asset-links-panel";
import { Badge, StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { AiContentCopilotPanel } from "@/components/dashboard/ai-content-copilot-panel";
import {
  buildProjectReadinessItems,
  projectPublicHref,
  PublicReadinessCard
} from "@/components/dashboard/public-readiness-card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/progress";
import { RelatedDocumentsPanel } from "@/components/related-documents-panel";
import type { ProjectRecord } from "@/lib/content-types";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { buildRelatedDocumentUploadHref } from "@/lib/document-upload-hrefs";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import type { AssetLinksForAsset, AssetLinkTargetOptions } from "@/lib/queries/asset-links";
import type { ProjectRelatedAssets } from "@/lib/queries/projects";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { statusLabel, visibilityLabel } from "@/lib/utils";

type ProjectResearchHubProps = {
  project: ProjectRecord;
  relatedAssets: ProjectRelatedAssets;
  assetLinks: AssetLinksForAsset;
  assetLinkOptions: AssetLinkTargetOptions;
  publicAttachmentCount: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  notice?: boolean;
};

type SearchType = "all" | "knowledge" | "publications" | "skills" | "documents";

function buildSearchHref(query: string, type: SearchType = "all") {
  const params = new URLSearchParams({ q: query, type });
  return `/dashboard/search?${params.toString()}`;
}

function buildDocumentsHref(projectId: string) {
  const params = new URLSearchParams({
    related_type: "project",
    related_id: projectId
  });

  return `/dashboard/documents?${params.toString()}`;
}

export function ProjectResearchHub({
  project,
  relatedAssets,
  assetLinks,
  assetLinkOptions,
  publicAttachmentCount,
  deleteAction,
  error,
  notice
}: ProjectResearchHubProps) {
  const uploadFileHref = buildRelatedDocumentUploadHref({
    relatedType: "project",
    relatedId: project.id,
    mode: "single",
    category: "research_material"
  });
  const uploadFolderHref = buildRelatedDocumentUploadHref({
    relatedType: "project",
    relatedId: project.id,
    mode: "batch",
    category: "research_material",
    collectionType: "folder_upload"
  });
  const documentsHref = buildDocumentsHref(project.id);
  const projectSearchHref = buildSearchHref(project.title, "all");
  const readinessItems = buildProjectReadinessItems({
    project,
    relatedAssets,
    assetLinks,
    publicAttachmentCount
  });
  const aiConfig = getAiProviderConfig();

  return (
    <>
      <PageHeader
        eyebrow="研究项目中枢"
        title={project.title}
        description="围绕研究问题、方法、资料和相关资产管理项目推进。"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/projects" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回项目
            </Link>
            <Link href={`/dashboard/projects/${project.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <Edit3 size={16} />
              编辑项目
            </Link>
            <form action={deleteAction}>
              <DeleteButton />
            </form>
          </div>
        }
      />

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          空文档包已删除。
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">项目推进态势</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <VisibilityBadge visibility={project.visibility} />
              {project.tags.length > 0 ? project.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {tag}
                </span>
              )) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">暂无标签</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-2xl bg-slate-50 px-3 py-2">更新：{formatDateTime(project.updated_at)}</span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2">进度：{project.progress}%</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          <ProjectOverviewCard project={project} />
          <ProjectResearchFraming project={project} />
          <RelatedDocumentsPanel
            relatedType="project"
            relatedId={project.id}
            title="项目文件与文档包"
            description="项目附件均为私密文件，只在管理员后台显示；文档包、独立文件和跨文档包文件继续按既有规则分组。"
            uploadFileLabel="上传项目文件"
            uploadBatchLabel="上传项目文件夹"
            uploadFileCategory="research_material"
            uploadBatchCategory="research_material"
            uploadBatchCollectionType="folder_upload"
            emptyText="还没有关联项目文件。可以上传研究资料、数据文件或项目文件夹作为私密附件。"
          />
          <AssetLinksPanel
            assetType="project"
            assetId={project.id}
            links={assetLinks}
            targetOptions={assetLinkOptions}
            returnTo={`/dashboard/projects/${project.id}`}
          />
          <ProjectRelatedAssetsCard project={project} relatedAssets={relatedAssets} />
        </main>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <ProjectQuickActions
            editHref={`/dashboard/projects/${project.id}/edit`}
            uploadFileHref={uploadFileHref}
            uploadFolderHref={uploadFolderHref}
            searchHref={projectSearchHref}
            knowledgeNewHref="/dashboard/knowledge/new"
            documentsHref={documentsHref}
          />
          <PublicReadinessCard items={readinessItems} publicHref={projectPublicHref(project)} />
          <AiContentCopilotPanel
            assetType="project"
            assetId={project.id}
            assetLabel="Project / 研究项目"
            isConfigured={aiConfig.isConfigured}
            providerLabel={getAiProviderDisplayName(aiConfig.provider)}
            model={aiConfig.model}
          />
          <ProjectMetadataCard project={project} />
          <ProjectMilestonesCard milestones={project.milestones} />
        </aside>
      </div>
    </>
  );
}

function ProjectOverviewCard({ project }: { project: ProjectRecord }) {
  return (
    <Card>
      <CardHeader
        title="项目概览"
        description="先快速确认这个研究项目的目标、阶段和公开边界。"
        action={<Badge className="bg-blue-50 text-blue-700 ring-blue-100">{statusLabel(project.status)}</Badge>}
      />
      <div className="prose prose-slate max-w-none text-sm leading-7">
        <MarkdownPreview content={project.summary} emptyText="尚未填写项目简介。" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="当前阶段" value={statusLabel(project.status)} />
        <Metric label="进度" value={`${project.progress}%`} />
        <Metric label="开始日期" value={formatDate(project.start_date)} />
        <Metric label="可见性" value={visibilityLabel(project.visibility)} />
      </div>
      <div className="mt-5">
        <Progress value={project.progress} />
      </div>
    </Card>
  );
}

function ProjectResearchFraming({ project }: { project: ProjectRecord }) {
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <Card>
        <CardHeader title="研究问题" description="这个项目试图回答什么。" />
        <MarkdownPreview content={project.research_question} emptyText="尚未填写研究问题。" />
      </Card>
      <Card>
        <CardHeader title="研究背景" description="为什么这个问题值得研究。" />
        <MarkdownPreview content={project.background} emptyText="尚未填写研究背景。" />
      </Card>
      <Card>
        <CardHeader title="研究方法" description="当前采用的数据、框架或分析路径。" />
        <MarkdownPreview content={project.methodology} emptyText="尚未填写研究方法。" />
      </Card>
    </section>
  );
}

function ProjectQuickActions({
  editHref,
  uploadFileHref,
  uploadFolderHref,
  searchHref,
  knowledgeNewHref,
  documentsHref
}: {
  editHref: string;
  uploadFileHref: string;
  uploadFolderHref: string;
  searchHref: string;
  knowledgeNewHref: string;
  documentsHref: string;
}) {
  return (
    <Card>
      <CardHeader title="快捷操作" description="围绕当前项目继续整理资料和沉淀知识。" />
      <div className="space-y-3">
        <ActionLink href={editHref} icon={Edit3} label="编辑项目" description="维护标题、状态、研究问题和方法。" />
        <ActionLink href={uploadFileHref} icon={Upload} label="上传项目文件" description="上传单个私密研究附件。" />
        <ActionLink href={uploadFolderHref} icon={FolderArchive} label="上传项目文件夹" description="上传文件夹或资料包并保留相对路径。" />
        <ActionLink href={documentsHref} icon={FileText} label="查看项目 Documents" description="进入文件中心查看当前项目筛选结果。" />
        <ActionLink href={searchHref} icon={Search} label="搜索项目标题" description="在后台全局搜索中查找相关资产。" />
        <ActionLink href={knowledgeNewHref} icon={BookOpen} label="创建知识笔记" description="使用现有知识库入口沉淀研究笔记。" />
      </div>
    </Card>
  );
}

function ProjectMetadataCard({ project }: { project: ProjectRecord }) {
  return (
    <Card>
      <CardHeader title="项目元数据" />
      <dl className="space-y-3 text-sm">
        <InfoRow label="标识" value={project.slug} />
        <InfoRow label="状态" value={statusLabel(project.status)} />
        <InfoRow label="可见性" value={visibilityLabel(project.visibility)} />
        <InfoRow label="精选" value={project.is_featured ? "是" : "否"} />
        <InfoRow label="创建" value={formatDateTime(project.created_at)} />
        <InfoRow label="更新" value={formatDateTime(project.updated_at)} />
      </dl>
    </Card>
  );
}

function ProjectMilestonesCard({ milestones }: { milestones: string[] }) {
  return (
    <Card>
      <CardHeader title="里程碑" description="用于跟踪研究推进节点。" />
      <div className="space-y-3">
        {milestones.length > 0 ? milestones.map((milestone, index) => (
          <div key={`${milestone}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold text-blue-700">{index + 1}</span>
            <span>{milestone}</span>
          </div>
        )) : <p className="text-sm text-slate-500">暂无里程碑。</p>}
      </div>
    </Card>
  );
}

function ProjectRelatedAssetsCard({ project, relatedAssets }: { project: ProjectRecord; relatedAssets: ProjectRelatedAssets }) {
  const hasExplicitAssets = relatedAssets.knowledgeNotes.length > 0 || relatedAssets.publications.length > 0;
  const titleSearchLinks = [
    { label: "搜索知识库", href: buildSearchHref(project.title, "knowledge") },
    { label: "搜索学术成果", href: buildSearchHref(project.title, "publications") },
    { label: "搜索 Skill", href: buildSearchHref(project.title, "skills") }
  ];

  return (
    <Card>
      <CardHeader
        title="相关研究资产"
        description="知识笔记与学术成果继续使用现有 project_id 关系；显式跨资产关系在上方独立维护。"
        action={
          <Link href={buildSearchHref(project.title, "all")} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Search size={15} />
            搜索全部
          </Link>
        }
      />

      {!hasExplicitAssets ? (
        <AdminEmptyState
          title="暂无显式关联资产"
          description="当前项目尚未读取到基于 project_id 的知识笔记 / 学术成果关联。可以先通过搜索按标题或标签查找相关资产。"
        />
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <RelatedKnowledgeList items={relatedAssets.knowledgeNotes} />
        <RelatedPublicationList items={relatedAssets.publications} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex gap-3">
          <Library className="mt-0.5 shrink-0 text-blue-700" size={18} />
          <div>
            <p className="text-sm font-semibold text-slate-950">搜索相关资产</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              显式跨资产关系已在上方维护；这里保留按项目标题和标签进入全局搜索的辅助入口。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {titleSearchLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  {item.label}
                </Link>
              ))}
              {project.tags.slice(0, 4).map((tag) => (
                <Link key={tag} href={buildSearchHref(tag, "all")} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  标签：{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RelatedKnowledgeList({ items }: { items: ProjectRelatedAssets["knowledgeNotes"] }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">关联知识笔记</h3>
        <span className="text-xs font-medium text-slate-400">{items.length}/5</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <AssetLink
              key={item.id}
              href={`/dashboard/knowledge/${item.id}`}
              title={item.title}
              eyebrow={item.category}
              description={item.excerpt ?? "尚未填写摘要。"}
              updatedAt={item.updated_at}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">暂无通过 project_id 关联的知识笔记。</p>
      )}
    </section>
  );
}

function RelatedPublicationList({ items }: { items: ProjectRelatedAssets["publications"] }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">关联学术成果</h3>
        <span className="text-xs font-medium text-slate-400">{items.length}/5</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <AssetLink
              key={item.id}
              href={`/dashboard/publications/${item.id}`}
              title={item.title}
              eyebrow={getPublicationTypeLabel(item.publication_type)}
              description={item.summary}
              updatedAt={item.published_on ?? item.updated_at}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">暂无通过 project_id 关联的学术成果。</p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function ActionLink({ href, icon: Icon, label, description }: { href: string; icon: LucideIcon; label: string; description: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/70">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950 group-hover:text-blue-800">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </Link>
  );
}

function AssetLink({
  href,
  title,
  eyebrow,
  description,
  updatedAt
}: {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  updatedAt: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl bg-slate-50 p-3 transition hover:bg-blue-50/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-700">{eyebrow}</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 group-hover:text-blue-800">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{description}</p>
          <p className="mt-2 text-xs text-slate-400">{formatDate(updatedAt)}</p>
        </div>
        <ArrowRight className="mt-1 shrink-0 text-slate-400 group-hover:text-blue-700" size={16} />
      </div>
    </Link>
  );
}
