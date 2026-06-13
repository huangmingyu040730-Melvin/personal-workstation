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
import { visibilityLabel } from "@/lib/utils";

type KnowledgeNodeHubProps = {
  note: KnowledgeNoteRecord;
  relatedProject: ProjectRecord | null;
  relatedPublications: PublicationRecord[];
  deleteAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  notice?: boolean;
};

type SearchType = "all" | "projects" | "publications" | "skills" | "documents";

function buildSearchHref(query: string, type: SearchType = "all") {
  const params = new URLSearchParams({ q: query, type });
  return `/dashboard/search?${params.toString()}`;
}

function buildDocumentsHref(noteId: string) {
  const params = new URLSearchParams({
    related_type: "knowledge",
    related_id: noteId
  });

  return `/dashboard/documents?${params.toString()}`;
}

export function KnowledgeNodeHub({
  note,
  relatedProject,
  relatedPublications,
  deleteAction,
  error,
  notice
}: KnowledgeNodeHubProps) {
  const uploadFileHref = buildRelatedDocumentUploadHref({
    relatedType: "knowledge",
    relatedId: note.id,
    mode: "single",
    category: "research_material"
  });
  const uploadFolderHref = buildRelatedDocumentUploadHref({
    relatedType: "knowledge",
    relatedId: note.id,
    mode: "batch",
    category: "research_material",
    collectionType: "attachment_bundle"
  });
  const documentsHref = buildDocumentsHref(note.id);
  const searchHref = buildSearchHref(note.title, "all");

  return (
    <>
      <PageHeader
        eyebrow="知识节点"
        title={note.title}
        description={note.excerpt ?? "尚未填写知识摘要。"}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/knowledge" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回知识库
            </Link>
            <Link href={`/dashboard/knowledge/${note.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <Edit3 size={16} />
              编辑知识节点
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">知识节点状态</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">{note.category}</Badge>
              <VisibilityBadge visibility={note.visibility} />
              {note.tags.length > 0 ? note.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {tag}
                </span>
              )) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">暂无标签</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-2xl bg-slate-50 px-3 py-2">更新：{formatDateTime(note.updated_at)}</span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2">创建：{formatDateTime(note.created_at)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          <KnowledgeOverviewCard note={note} relatedProject={relatedProject} />
          <KnowledgeContentCard note={note} />
          <RelatedDocumentsPanel
            relatedType="knowledge"
            relatedId={note.id}
            title="知识资料与附件"
            description="知识资料均为私密文件，只在管理员后台显示；文档包、独立文件和跨文档包文件继续按既有规则分组。"
            uploadFileLabel="上传知识资料"
            uploadBatchLabel="上传知识资料文件夹"
            uploadFileCategory="research_material"
            uploadBatchCategory="research_material"
            uploadBatchCollectionType="attachment_bundle"
            emptyText="还没有关联知识资料。可以上传参考文献、摘录、数据文件或资料包作为私密附件。"
          />
          <KnowledgeRelatedPublicationsCard
            note={note}
            relatedProject={relatedProject}
            relatedPublications={relatedPublications}
          />
        </main>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <KnowledgeQuickActions
            note={note}
            relatedProject={relatedProject}
            editHref={`/dashboard/knowledge/${note.id}/edit`}
            uploadFileHref={uploadFileHref}
            uploadFolderHref={uploadFolderHref}
            documentsHref={documentsHref}
            searchHref={searchHref}
          />
          <KnowledgeProjectCard note={note} project={relatedProject} />
          <KnowledgeMetadataCard note={note} />
          <KnowledgeAssetSearchCard note={note} />
        </aside>
      </div>
    </>
  );
}

function KnowledgeOverviewCard({ note, relatedProject }: { note: KnowledgeNoteRecord; relatedProject: ProjectRecord | null }) {
  return (
    <Card>
      <CardHeader
        title="知识概览"
        description="快速确认这个知识节点的摘要、分类和研究归属。"
        action={<Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">{note.category}</Badge>}
      />
      <MarkdownPreview content={note.excerpt} emptyText="尚未填写知识摘要。" />
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="分类" value={note.category} />
        <Metric label="可见性" value={visibilityLabel(note.visibility)} />
        <Metric label="关联项目" value={relatedProject?.title ?? "尚未关联研究项目"} />
        <Metric label="更新时间" value={formatDate(note.updated_at)} />
      </div>
    </Card>
  );
}

function KnowledgeContentCard({ note }: { note: KnowledgeNoteRecord }) {
  return (
    <Card>
      <CardHeader title="知识正文" description="沉淀观点、资料、方法、摘录和研究过程记录。" />
      <MarkdownPreview content={note.content} emptyText="尚未填写知识正文。" />
    </Card>
  );
}

function KnowledgeQuickActions({
  note,
  relatedProject,
  editHref,
  uploadFileHref,
  uploadFolderHref,
  documentsHref,
  searchHref
}: {
  note: KnowledgeNoteRecord;
  relatedProject: ProjectRecord | null;
  editHref: string;
  uploadFileHref: string;
  uploadFolderHref: string;
  documentsHref: string;
  searchHref: string;
}) {
  return (
    <Card>
      <CardHeader title="快捷操作" description="围绕当前知识节点继续整理资料和关联研究资产。" />
      <div className="space-y-3">
        <ActionLink href={editHref} icon={Edit3} label="编辑知识节点" description="维护摘要、正文、分类、标签和关联项目。" />
        <ActionLink href={uploadFileHref} icon={Upload} label="上传知识资料" description="上传单个私密参考资料或摘录文件。" />
        <ActionLink href={uploadFolderHref} icon={FolderArchive} label="上传知识资料文件夹" description="上传资料文件夹并保留相对路径。" />
        <ActionLink href={documentsHref} icon={FileText} label="查看相关 Documents" description="进入文件中心查看当前知识节点筛选结果。" />
        <ActionLink href={searchHref} icon={Search} label="搜索知识标题" description="在后台全局搜索中查找相关资产。" />
        <ActionLink href={buildSearchHref(note.title, "projects")} icon={BookOpen} label="搜索相关 Project" description="按知识标题查找可能相关的研究项目。" />
        <ActionLink href={buildSearchHref(note.title, "publications")} icon={Library} label="搜索相关 Publication" description="按知识标题查找可能相关的学术成果。" />
        <ActionLink href={buildSearchHref(note.title, "skills")} icon={Search} label="搜索相关 Skill" description="按知识标题查找可能相关的工作流。" />
        {relatedProject ? (
          <ActionLink href={`/dashboard/projects/${relatedProject.id}`} icon={ArrowRight} label="打开关联 Project" description="进入该知识节点所属研究项目。" />
        ) : null}
      </div>
    </Card>
  );
}

function KnowledgeProjectCard({ note, project }: { note: KnowledgeNoteRecord; project: ProjectRecord | null }) {
  return (
    <Card>
      <CardHeader title="关联 Project" description="知识节点的研究上下文。" />
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
            description={note.project_id ? "当前关联项目未能读取。请检查项目是否存在，或在编辑页重新选择。" : "当前知识节点尚未关联研究项目。"}
          />
          <Link href={buildSearchHref(note.title, "projects")} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Search size={15} />
            搜索相关 Project
          </Link>
        </div>
      )}
    </Card>
  );
}

function KnowledgeRelatedPublicationsCard({
  note,
  relatedProject,
  relatedPublications
}: {
  note: KnowledgeNoteRecord;
  relatedProject: ProjectRecord | null;
  relatedPublications: PublicationRecord[];
}) {
  return (
    <Card>
      <CardHeader
        title="相关成果"
        description="当前没有 Knowledge 与 Publication 的直接关系；若知识节点关联了 Project，这里展示同项目成果。"
        action={
          <Link href={buildSearchHref(note.title, "publications")} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Search size={15} />
            搜索成果
          </Link>
        }
      />
      {relatedProject ? (
        <p className="text-sm leading-6 text-slate-500">
          基于关联 Project“{relatedProject.title}”展示同项目成果，最多 5 条；本阶段不新增直接成果关系。
        </p>
      ) : (
        <AdminEmptyState
          title="暂无可推导的同项目成果"
          description="当前知识节点尚未关联研究项目，因此不展示同项目成果。可以先通过标题搜索相关 Publication。"
        />
      )}
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {relatedPublications.length > 0 ? relatedPublications.map((publication) => (
          <AssetLink
            key={publication.id}
            href={`/dashboard/publications/${publication.id}`}
            title={publication.title}
            eyebrow={getPublicationTypeLabel(publication.publication_type)}
            description={publication.summary}
            updatedAt={publication.published_on ?? publication.updated_at}
          />
        )) : (
          relatedProject ? <p className="text-sm leading-6 text-slate-500">该关联项目下暂无成果。</p> : null
        )}
      </div>
    </Card>
  );
}

function KnowledgeMetadataCard({ note }: { note: KnowledgeNoteRecord }) {
  return (
    <Card>
      <CardHeader title="知识元数据" />
      <dl className="space-y-3 text-sm">
        <InfoRow label="标识" value={note.slug} />
        <InfoRow label="分类" value={note.category} />
        <InfoRow label="可见性" value={visibilityLabel(note.visibility)} />
        <InfoRow label="精选" value={note.is_featured ? "是" : "否"} />
        <InfoRow label="关联项目" value={note.projects?.title ?? "未关联"} />
        <InfoRow label="创建" value={formatDateTime(note.created_at)} />
        <InfoRow label="更新" value={formatDateTime(note.updated_at)} />
      </dl>
    </Card>
  );
}

function KnowledgeAssetSearchCard({ note }: { note: KnowledgeNoteRecord }) {
  const searchLinks = [
    { label: "搜索 Project", href: buildSearchHref(note.title, "projects") },
    { label: "搜索 Publication", href: buildSearchHref(note.title, "publications") },
    { label: "搜索 Skill", href: buildSearchHref(note.title, "skills") }
  ];

  return (
    <Card>
      <CardHeader title="相关资产搜索" description="没有显式关联字段时，先使用后台全局搜索定位资产。" />
      <div className="space-y-3">
        {searchLinks.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            <span>{item.label}</span>
            <ArrowRight size={15} />
          </Link>
        ))}
        {note.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {note.tags.slice(0, 4).map((tag) => (
              <Link key={tag} href={buildSearchHref(tag, "all")} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                标签：{tag}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">暂无标签可用于扩展搜索。</p>
        )}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">{value}</p>
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
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
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
          <p className="text-xs font-semibold text-emerald-700">{eyebrow}</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 group-hover:text-blue-800">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{description}</p>
          <p className="mt-2 text-xs text-slate-400">{formatDate(updatedAt)}</p>
        </div>
        <ArrowRight className="mt-1 shrink-0 text-slate-400 group-hover:text-blue-700" size={16} />
      </div>
    </Link>
  );
}
