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
  Tags,
  Upload
} from "lucide-react";
import { AdminEmptyState, AdminSecurityNote } from "@/components/admin-ui";
import { AssetLinksPanel } from "@/components/asset-links/asset-links-panel";
import { Badge, StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { RelatedDocumentsPanel } from "@/components/related-documents-panel";
import { getPublicationTypeLabel } from "@/lib/content-options";
import type { KnowledgeNoteRecord, ProjectRecord, PublicationRecord } from "@/lib/content-types";
import { buildRelatedDocumentUploadHref } from "@/lib/document-upload-hrefs";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import type { AssetLinksForAsset, AssetLinkTargetOptions } from "@/lib/queries/asset-links";
import { visibilityLabel } from "@/lib/utils";

type PublicationOutputHubProps = {
  publication: PublicationRecord;
  relatedProject: ProjectRecord | null;
  relatedKnowledge: KnowledgeNoteRecord[];
  assetLinks: AssetLinksForAsset;
  assetLinkOptions: AssetLinkTargetOptions;
  deleteAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  notice?: boolean;
};

type SearchType = "all" | "projects" | "publications" | "knowledge" | "skills" | "documents";

function buildSearchHref(query: string, type: SearchType = "all") {
  const params = new URLSearchParams({ q: query, type });
  return `/dashboard/search?${params.toString()}`;
}

function buildDocumentsHref(publicationId: string) {
  const params = new URLSearchParams({
    related_type: "publication",
    related_id: publicationId
  });

  return `/dashboard/documents?${params.toString()}`;
}

export function PublicationOutputHub({
  publication,
  relatedProject,
  relatedKnowledge,
  assetLinks,
  assetLinkOptions,
  deleteAction,
  error,
  notice
}: PublicationOutputHubProps) {
  const uploadFileHref = buildRelatedDocumentUploadHref({
    relatedType: "publication",
    relatedId: publication.id,
    mode: "single",
    category: "publication_attachment"
  });
  const uploadFolderHref = buildRelatedDocumentUploadHref({
    relatedType: "publication",
    relatedId: publication.id,
    mode: "batch",
    category: "publication_attachment",
    collectionType: "attachment_bundle"
  });
  const documentsHref = buildDocumentsHref(publication.id);
  const searchHref = buildSearchHref(publication.title, "all");

  return (
    <>
      <PageHeader
        eyebrow="研究成果中枢"
        title={publication.title}
        description={publication.summary || "尚未填写成果摘要。"}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/publications" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回成果
            </Link>
            <Link href={`/dashboard/publications/${publication.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <Edit3 size={16} />
              编辑成果
            </Link>
            <form action={deleteAction}>
              <DeleteButton label="删除成果" />
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
            <p className="text-xs font-semibold uppercase text-blue-700">成果发布状态</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getPublicationTypeLabel(publication.publication_type)}</Badge>
              <VisibilityBadge visibility={publication.visibility} />
              {publication.tags.length > 0 ? publication.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {tag}
                </span>
              )) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">暂无标签</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-2xl bg-slate-50 px-3 py-2">发表：{formatDate(publication.published_on)}</span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2">更新：{formatDateTime(publication.updated_at)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          <PublicationOverviewCard publication={publication} relatedProject={relatedProject} />
          <PublicationAbstractCard publication={publication} />
          <RelatedDocumentsPanel
            relatedType="publication"
            relatedId={publication.id}
            title="成果材料与附件"
            description="成果材料均为私密文件，只在管理员后台显示；文档包、独立文件和跨文档包文件继续按既有规则分组。"
            uploadFileLabel="上传成果材料"
            uploadBatchLabel="上传成果材料文件夹"
            uploadFileCategory="publication_attachment"
            uploadBatchCategory="publication_attachment"
            uploadBatchCollectionType="attachment_bundle"
            emptyText="还没有关联成果材料。可以上传论文、报告、补充材料、数据文件或资料包作为私密附件。"
          />
          <AssetLinksPanel
            assetType="publication"
            assetId={publication.id}
            links={assetLinks}
            targetOptions={assetLinkOptions}
            returnTo={`/dashboard/publications/${publication.id}`}
          />
          <PublicationRelatedKnowledgeCard
            publication={publication}
            relatedProject={relatedProject}
            relatedKnowledge={relatedKnowledge}
          />
        </main>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <PublicationQuickActions
            publication={publication}
            relatedProject={relatedProject}
            editHref={`/dashboard/publications/${publication.id}/edit`}
            uploadFileHref={uploadFileHref}
            uploadFolderHref={uploadFolderHref}
            documentsHref={documentsHref}
            searchHref={searchHref}
          />
          <PublicationProjectCard publication={publication} project={relatedProject} />
          <PublicationMetadataCard publication={publication} />
          <PublicationAssetSearchCard publication={publication} relatedProject={relatedProject} />
        </aside>
      </div>
    </>
  );
}

function PublicationOverviewCard({ publication, relatedProject }: { publication: PublicationRecord; relatedProject: ProjectRecord | null }) {
  return (
    <Card>
      <CardHeader
        title="成果概览"
        description="快速确认这个成果的摘要、类型、发表信息和研究归属。"
        action={<Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getPublicationTypeLabel(publication.publication_type)}</Badge>}
      />
      <MarkdownPreview content={publication.summary} emptyText="尚未填写成果摘要。" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="成果类型" value={getPublicationTypeLabel(publication.publication_type)} />
        <Metric label="发表日期" value={formatDate(publication.published_on)} />
        <Metric label="关联项目" value={relatedProject?.title ?? "尚未关联研究项目"} />
        <Metric label="可见性" value={visibilityLabel(publication.visibility)} />
        <Metric label="标签" value={publication.tags.length > 0 ? publication.tags.join("、") : "暂无标签"} />
        <Metric label="更新时间" value={formatDate(publication.updated_at)} />
      </div>
    </Card>
  );
}

function PublicationAbstractCard({ publication }: { publication: PublicationRecord }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="成果摘要 / Summary" description="用于快速理解成果结论、贡献和适用场景。" />
        <MarkdownPreview content={publication.summary} emptyText="尚未填写成果摘要。" />
      </Card>
      <Card>
        <CardHeader title="Abstract" description="论文、报告或作品的完整摘要信息。" />
        <MarkdownPreview content={publication.abstract} emptyText="尚未填写成果摘要 / abstract。" />
      </Card>
    </section>
  );
}

function PublicationQuickActions({
  publication,
  relatedProject,
  editHref,
  uploadFileHref,
  uploadFolderHref,
  documentsHref,
  searchHref
}: {
  publication: PublicationRecord;
  relatedProject: ProjectRecord | null;
  editHref: string;
  uploadFileHref: string;
  uploadFolderHref: string;
  documentsHref: string;
  searchHref: string;
}) {
  return (
    <Card>
      <CardHeader title="快捷操作" description="围绕当前成果继续整理材料和查找相关研究资产。" />
      <div className="space-y-3">
        <ActionLink href={editHref} icon={Edit3} label="编辑成果" description="维护成果摘要、类型、发表日期、标签和关联项目。" />
        <ActionLink href={uploadFileHref} icon={Upload} label="上传成果材料" description="上传单个私密论文、报告、数据或补充材料。" />
        <ActionLink href={uploadFolderHref} icon={FolderArchive} label="上传成果材料文件夹" description="上传成果资料文件夹并保留相对路径。" />
        <ActionLink href={documentsHref} icon={FileText} label="查看相关 Documents" description="进入文件中心查看当前成果筛选结果。" />
        <ActionLink href={searchHref} icon={Search} label="搜索成果标题" description="在后台全局搜索中查找相关资产。" />
        <ActionLink href={buildSearchHref(publication.title, "projects")} icon={BookOpen} label="搜索相关 Project" description="按成果标题查找可能相关的研究项目。" />
        <ActionLink href={buildSearchHref(publication.title, "knowledge")} icon={Library} label="搜索相关 Knowledge" description="按成果标题查找可能相关的知识节点。" />
        <ActionLink href={buildSearchHref(publication.title, "skills")} icon={Search} label="搜索相关 Skill" description="按成果标题查找可能相关的工作流。" />
        {relatedProject ? (
          <ActionLink href={`/dashboard/projects/${relatedProject.id}`} icon={ArrowRight} label="打开关联 Project" description="进入该成果所属研究项目。" />
        ) : null}
      </div>
    </Card>
  );
}

function PublicationProjectCard({ publication, project }: { publication: PublicationRecord; project: ProjectRecord | null }) {
  return (
    <Card>
      <CardHeader title="关联 Project" description="成果所属的研究上下文。" />
      {project ? (
        <Link href={`/dashboard/projects/${project.id}`} className="group block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/70">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950 group-hover:text-blue-800">{project.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={project.status} />
                <VisibilityBadge visibility={project.visibility} />
              </div>
              <p className="mt-3 text-xs text-slate-400">更新：{formatDateTime(project.updated_at)}</p>
            </div>
            <ArrowRight className="mt-1 shrink-0 text-slate-400 group-hover:text-blue-700" size={16} />
          </div>
        </Link>
      ) : (
        <div>
          <AdminEmptyState
            title="尚未关联研究项目"
            description={publication.project_id ? "当前关联项目未能读取。请检查项目是否存在，或在编辑页重新选择。" : "当前成果尚未关联研究项目。"}
          />
          <Link href={buildSearchHref(publication.title, "projects")} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Search size={15} />
            搜索相关 Project
          </Link>
        </div>
      )}
    </Card>
  );
}

function PublicationRelatedKnowledgeCard({
  publication,
  relatedProject,
  relatedKnowledge
}: {
  publication: PublicationRecord;
  relatedProject: ProjectRecord | null;
  relatedKnowledge: KnowledgeNoteRecord[];
}) {
  return (
    <Card>
      <CardHeader
        title="同项目知识节点"
        description="这里继续使用现有 `project_id` 关系展示同项目 Knowledge；显式 Publication / Knowledge 关系在上方维护。"
        action={<Link href={buildSearchHref(publication.title, "knowledge")} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"><Search size={15} />搜索 Knowledge</Link>}
      />
      {relatedProject && relatedKnowledge.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {relatedKnowledge.map((note) => (
            <Link key={note.id} href={`/dashboard/knowledge/${note.id}`} className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 group-hover:text-blue-800">{note.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{note.excerpt ?? "尚未填写知识摘要。"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">{note.category}</Badge>
                    <VisibilityBadge visibility={note.visibility} />
                  </div>
                </div>
                <ArrowRight className="mt-1 shrink-0 text-slate-400 group-hover:text-blue-700" size={16} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title={relatedProject ? "暂无同项目知识节点" : "尚未关联研究项目"}
          description={relatedProject ? "当前成果所属项目下暂未读取到 Knowledge；可先通过成果标题搜索相关知识。" : "当前成果没有关联 Project，因此不展示同项目 Knowledge。可先通过成果标题搜索相关知识节点。"}
        />
      )}
      <div className="mt-5">
        <AdminSecurityNote>
          本页不伪造 Publication 与 Knowledge / Skill 的直接关系；显式关系只由管理员手动创建。
        </AdminSecurityNote>
      </div>
    </Card>
  );
}

function PublicationMetadataCard({ publication }: { publication: PublicationRecord }) {
  return (
    <Card>
      <CardHeader title="Metadata" description="用于后台维护和排查的记录信息；不展示旧附件路径或 Storage 路径。" />
      <dl className="space-y-3 text-sm">
        <MetadataRow label="标识" value={publication.slug} />
        <MetadataRow label="类型" value={getPublicationTypeLabel(publication.publication_type)} />
        <MetadataRow label="发表" value={formatDate(publication.published_on)} />
        <MetadataRow label="封面" value={publication.cover_url ? "已记录封面链接" : "未记录"} />
        <MetadataRow label="精选" value={publication.is_featured ? "是" : "否"} />
        <MetadataRow label="创建" value={formatDateTime(publication.created_at)} />
        <MetadataRow label="更新" value={formatDateTime(publication.updated_at)} />
      </dl>
    </Card>
  );
}

function PublicationAssetSearchCard({ publication, relatedProject }: { publication: PublicationRecord; relatedProject: ProjectRecord | null }) {
  return (
    <Card>
      <CardHeader title="相关资产搜索" description="保留后台 metadata 搜索入口，用于扩展查找相关资产。" />
      <div className="space-y-3">
        <ActionLink href={buildSearchHref(publication.title, "projects")} icon={BookOpen} label="搜索 Project" description="按成果标题查找可能相关的研究项目。" />
        <ActionLink href={buildSearchHref(publication.title, "knowledge")} icon={Library} label="搜索 Knowledge" description="按成果标题查找可能相关的知识节点。" />
        <ActionLink href={buildSearchHref(publication.title, "skills")} icon={Search} label="搜索 Skill" description="按成果标题查找可能相关的能力包。" />
        <ActionLink href={buildSearchHref(publication.title, "all")} icon={Search} label="搜索全部资产" description="在后台全局搜索中查看所有类型的匹配结果。" />
        {relatedProject ? (
          <ActionLink href={buildSearchHref(relatedProject.title, "all")} icon={BookOpen} label="按 Project 标题搜索" description="用关联项目标题查找更多同主题资产。" />
        ) : null}
      </div>
      {publication.tags.length > 0 ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Tags size={15} />
            按标签搜索
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {publication.tags.map((tag) => (
              <Link key={tag} href={buildSearchHref(tag, "all")} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                {tag}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ActionLink({
  href,
  icon: Icon,
  label,
  description
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/70">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm group-hover:text-blue-900">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-semibold text-slate-950 group-hover:text-blue-800">
          {label}
          <ArrowRight size={14} />
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="break-words text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
