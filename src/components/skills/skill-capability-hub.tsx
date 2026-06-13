import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Edit3,
  FileText,
  FolderArchive,
  GitBranch,
  Library,
  Search,
  Upload
} from "lucide-react";
import { AdminEmptyState, AdminFormSection, AdminSecurityNote } from "@/components/admin-ui";
import { AssetLinksPanel } from "@/components/asset-links/asset-links-panel";
import { Badge, StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { Field, Textarea, TextInput } from "@/components/forms/form-fields";
import { DeleteButton, SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { RelatedDocumentsPanel } from "@/components/related-documents-panel";
import type { SkillRecord, SkillVersionRecord } from "@/lib/content-types";
import { buildRelatedDocumentUploadHref } from "@/lib/document-upload-hrefs";
import { formatDate, formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import type { AssetLinksForAsset, AssetLinkTargetOptions } from "@/lib/queries/asset-links";
import { statusLabel, visibilityLabel } from "@/lib/utils";

type SkillCapabilityHubProps = {
  skill: SkillRecord;
  versions: SkillVersionRecord[];
  assetLinks: AssetLinksForAsset;
  assetLinkOptions: AssetLinkTargetOptions;
  deleteAction: (formData: FormData) => void | Promise<void>;
  createVersionAction: (formData: FormData) => void | Promise<void>;
  error?: string;
  notice?: boolean;
};

type SearchType = "all" | "projects" | "publications" | "knowledge" | "skills" | "documents";

function buildSearchHref(query: string, type: SearchType = "all") {
  const params = new URLSearchParams({ q: query, type });
  return `/dashboard/search?${params.toString()}`;
}

function buildDocumentsHref(skillId: string) {
  const params = new URLSearchParams({
    related_type: "skill",
    related_id: skillId
  });

  return `/dashboard/documents?${params.toString()}`;
}

function platformSummary(platforms: string[]) {
  return platforms.length > 0 ? platforms.join("、") : "暂无平台信息";
}

export function SkillCapabilityHub({
  skill,
  versions,
  assetLinks,
  assetLinkOptions,
  deleteAction,
  createVersionAction,
  error,
  notice
}: SkillCapabilityHubProps) {
  const uploadFileHref = buildRelatedDocumentUploadHref({
    relatedType: "skill",
    relatedId: skill.id,
    mode: "single",
    category: "skill_attachment"
  });
  const uploadFolderHref = buildRelatedDocumentUploadHref({
    relatedType: "skill",
    relatedId: skill.id,
    mode: "batch",
    category: "skill_attachment",
    collectionType: "skill_package"
  });
  const documentsHref = buildDocumentsHref(skill.id);
  const skillSearchHref = buildSearchHref(skill.name, "all");

  return (
    <>
      <PageHeader
        eyebrow="能力包 / 工作流包"
        title={skill.name}
        description={skill.description || "尚未填写能力包说明。"}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/skills" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              <ArrowLeft size={16} />
              返回 Skill 库
            </Link>
            <Link href={`/dashboard/skills/${skill.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <Edit3 size={16} />
              编辑能力包
            </Link>
            <form action={deleteAction}>
              <DeleteButton label="删除 Skill" />
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">能力包状态</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{skill.category}</Badge>
              <StatusBadge status={skill.status} />
              <VisibilityBadge visibility={skill.visibility} />
              {skill.platforms.length > 0 ? skill.platforms.slice(0, 6).map((platform) => (
                <span key={platform} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                  {platform}
                </span>
              )) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">暂无平台信息</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-2xl bg-slate-50 px-3 py-2">版本：{skill.current_version ?? "暂无版本信息"}</span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2">更新：{formatDateTime(skill.updated_at)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          <SkillOverviewCard skill={skill} />
          <SkillContentCard skill={skill} />
          <RelatedDocumentsPanel
            relatedType="skill"
            relatedId={skill.id}
            title="Skill 资料与能力包附件"
            description="Skill 资料均为私密文件，只在管理员后台显示；文档包、独立文件和跨文档包文件继续按既有规则分组。"
            uploadFileLabel="上传 Skill 资料"
            uploadBatchLabel="上传 Skill 资料文件夹"
            uploadFileCategory="skill_attachment"
            uploadBatchCategory="skill_attachment"
            uploadBatchCollectionType="skill_package"
            emptyText="还没有关联 Skill 资料。可以上传说明文档、提示词、代码包、zip 包或文件夹作为私密附件。"
            securityNote="Skill package 只作为私密资料存储和管理。不安装、不解析、不执行上传代码，也不会生成公开下载入口。"
          />
          <AssetLinksPanel
            assetType="skill"
            assetId={skill.id}
            links={assetLinks}
            targetOptions={assetLinkOptions}
            returnTo={`/dashboard/skills/${skill.id}`}
          />
          <SkillRelatedAssetsCard skill={skill} />
        </main>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <SkillQuickActions
            skill={skill}
            editHref={`/dashboard/skills/${skill.id}/edit`}
            uploadFileHref={uploadFileHref}
            uploadFolderHref={uploadFolderHref}
            documentsHref={documentsHref}
            searchHref={skillSearchHref}
          />
          <SkillPlatformVersionCard skill={skill} />
          <SkillVersionsCard versions={versions} createVersionAction={createVersionAction} />
          <SkillMetadataCard skill={skill} />
        </aside>
      </div>
    </>
  );
}

function SkillOverviewCard({ skill }: { skill: SkillRecord }) {
  return (
    <Card>
      <CardHeader
        title="能力包概览"
        description="快速确认这个 Skill 的用途、平台、状态、版本和公开边界。"
        action={<Badge className="bg-blue-50 text-blue-700 ring-blue-100">{skill.category}</Badge>}
      />
      <MarkdownPreview content={skill.description} emptyText="尚未填写能力包说明。" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="分类" value={skill.category} />
        <Metric label="平台" value={platformSummary(skill.platforms)} />
        <Metric label="状态" value={statusLabel(skill.status)} />
        <Metric label="当前版本" value={skill.current_version ?? "暂无版本信息"} />
        <Metric label="可见性" value={visibilityLabel(skill.visibility)} />
        <Metric label="更新时间" value={formatDate(skill.updated_at)} />
      </div>
    </Card>
  );
}

function SkillContentCard({ skill }: { skill: SkillRecord }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="使用说明 / 工作流内容" description="记录这个能力包的工作流、提示词、方法说明或自动化使用方式。" />
        <MarkdownPreview content={skill.content} emptyText="尚未填写 Skill 使用说明。" />
      </Card>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="输入内容说明" description="使用前需要准备的材料、上下文或参数。" />
          <MarkdownPreview content={skill.input_description} emptyText="尚未填写输入说明。" />
        </Card>
        <Card>
          <CardHeader title="输出内容说明" description="运行后期望得到的结果、格式或交付物。" />
          <MarkdownPreview content={skill.output_description} emptyText="尚未填写输出说明。" />
        </Card>
        <Card>
          <CardHeader title="使用指南" description="操作步骤、注意事项和维护方式。" />
          <MarkdownPreview content={skill.usage_guide} emptyText="尚未填写使用指南。" />
        </Card>
      </section>

      <Card>
        <CardHeader title="SKILL.md" description="仅展示已记录的说明文本；站内不会执行、安装或解析 Skill package。" />
        <MarkdownPreview content={skill.skill_md_content} emptyText="尚未填写 SKILL.md 内容。" />
      </Card>
    </div>
  );
}

function SkillQuickActions({
  skill,
  editHref,
  uploadFileHref,
  uploadFolderHref,
  documentsHref,
  searchHref
}: {
  skill: SkillRecord;
  editHref: string;
  uploadFileHref: string;
  uploadFolderHref: string;
  documentsHref: string;
  searchHref: string;
}) {
  return (
    <Card>
      <CardHeader title="快捷操作" description="围绕当前能力包继续整理资料、版本和相关研究资产。" />
      <div className="space-y-3">
        <ActionLink href={editHref} icon={Edit3} label="编辑 Skill" description="维护说明、平台、版本、状态和公开边界。" />
        <ActionLink href={uploadFileHref} icon={Upload} label="上传 Skill 资料" description="上传单个私密说明文档、提示词或参考资料。" />
        <ActionLink href={uploadFolderHref} icon={FolderArchive} label="上传 Skill 资料文件夹" description="上传能力包资料文件夹并保留相对路径。" />
        <ActionLink href={documentsHref} icon={FileText} label="查看相关 Documents" description="进入文件中心查看当前 Skill 筛选结果。" />
        <ActionLink href={searchHref} icon={Search} label="搜索 Skill 名称" description="在后台全局搜索中查找相关资产。" />
        <ActionLink href={buildSearchHref(skill.name, "projects")} icon={BookOpen} label="搜索相关 Project" description="按 Skill 名称查找可能相关的研究项目。" />
        <ActionLink href={buildSearchHref(skill.name, "knowledge")} icon={Library} label="搜索相关 Knowledge" description="按 Skill 名称查找可能相关的知识节点。" />
        <ActionLink href={buildSearchHref(skill.name, "publications")} icon={FileText} label="搜索相关 Publication" description="按 Skill 名称查找可能相关的学术成果。" />
        {skill.platforms.slice(0, 3).map((platform) => (
          <ActionLink
            key={platform}
            href={buildSearchHref(platform, "all")}
            icon={Search}
            label={`按平台搜索：${platform}`}
            description="用平台关键词在全局资产中查找相关内容。"
          />
        ))}
      </div>
    </Card>
  );
}

function SkillPlatformVersionCard({ skill }: { skill: SkillRecord }) {
  return (
    <Card>
      <CardHeader title="平台与版本" description="能力包的适用环境和当前维护状态。" />
      <dl className="space-y-3 text-sm">
        <MetadataRow label="平台" value={platformSummary(skill.platforms)} />
        <MetadataRow label="当前版本" value={skill.current_version ?? "暂无版本信息"} />
        <MetadataRow label="状态" value={statusLabel(skill.status)} />
        <MetadataRow label="分类" value={skill.category} />
        <MetadataRow label="可见性" value={visibilityLabel(skill.visibility)} />
        <MetadataRow label="更新" value={formatDateTime(skill.updated_at)} />
      </dl>
      <PlatformChips platforms={skill.platforms} />
      {skill.repository_url ? (
        <Link href={skill.repository_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
          <GitBranch size={16} />
          打开代码仓库
        </Link>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">尚未填写代码仓库链接。</p>
      )}
    </Card>
  );
}

function SkillVersionsCard({
  versions,
  createVersionAction
}: {
  versions: SkillVersionRecord[];
  createVersionAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="版本记录" description="沿用现有 Skill 版本记录，不新增独立版本管理系统。" />
        <div className="space-y-3">
          {versions.length > 0 ? versions.map((version) => (
            <div key={version.id} className="rounded-2xl bg-slate-50 p-3">
              <p className="font-medium text-slate-900">{version.version}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(version.released_at ?? version.created_at)}</p>
              {version.notes ? <p className="mt-2 text-sm leading-6 text-slate-600">{version.notes}</p> : null}
            </div>
          )) : <p className="text-sm text-slate-500">暂无版本记录。</p>}
        </div>
      </Card>

      <AdminFormSection title="新增版本记录" description="只写入现有 `skill_versions` 记录，用于维护备注和发布时间。">
        <form action={createVersionAction} className="space-y-4">
          <Field label="版本号">
            <TextInput name="version" placeholder="v1.1.0" required />
          </Field>
          <Field label="更新说明">
            <Textarea name="notes" />
          </Field>
          <Field label="发布时间">
            <TextInput name="released_at" type="datetime-local" />
          </Field>
          <SubmitButton>新增版本</SubmitButton>
        </form>
      </AdminFormSection>
    </div>
  );
}

function SkillRelatedAssetsCard({ skill }: { skill: SkillRecord }) {
  const assetLinks = [
    {
      href: buildSearchHref(skill.name, "projects"),
      icon: BookOpen,
      label: "搜索相关 Project",
      description: "按能力包名称查找可能关联的研究项目。"
    },
    {
      href: buildSearchHref(skill.name, "knowledge"),
      icon: Library,
      label: "搜索相关 Knowledge",
      description: "按能力包名称查找可能关联的知识节点。"
    },
    {
      href: buildSearchHref(skill.name, "publications"),
      icon: FileText,
      label: "搜索相关 Publication",
      description: "按能力包名称查找可能关联的学术成果。"
    }
  ];

  return (
    <Card>
      <CardHeader title="相关研究资产搜索" description="显式跨资产关系已在上方维护；这里保留后台全局搜索辅助定位。" />
      <AdminEmptyState
        title="搜索相关资产"
        description="可通过标题或平台搜索相关研究资产；已确认的关系请在上方显式关联区域维护。"
      />
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {assetLinks.map((item) => (
          <ActionLink key={item.href} href={item.href} icon={item.icon} label={item.label} description={item.description} />
        ))}
      </div>
      {skill.platforms.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-900">按平台搜索</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skill.platforms.map((platform) => (
              <Link key={platform} href={buildSearchHref(platform, "all")} className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">
                {platform}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-5">
        <AdminSecurityNote>
          本页不推断或伪造相关资产；显式关系只由管理员手动创建。
        </AdminSecurityNote>
      </div>
    </Card>
  );
}

function SkillMetadataCard({ skill }: { skill: SkillRecord }) {
  return (
    <Card>
      <CardHeader title="Metadata" description="用于后台维护和排查的记录信息。" />
      <dl className="space-y-3 text-sm">
        <MetadataRow label="标识" value={skill.slug} />
        <MetadataRow label="精选" value={skill.is_featured ? "是" : "否"} />
        <MetadataRow label="创建" value={formatDateTime(skill.created_at)} />
        <MetadataRow label="更新" value={formatDateTime(skill.updated_at)} />
      </dl>
    </Card>
  );
}

function PlatformChips({ platforms }: { platforms: string[] }) {
  if (platforms.length === 0) {
    return <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">暂无平台信息。</p>;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <span key={platform} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
          {platform}
        </span>
      ))}
    </div>
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
