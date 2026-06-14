import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { getPublicationTypeLabel } from "@/lib/content-options";
import type { KnowledgeNoteRecord, ProjectRecord, PublicationRecord, SkillRecord } from "@/lib/content-types";
import type { AssetLinksForAsset } from "@/lib/queries/asset-links";
import type { ProjectRelatedAssets } from "@/lib/queries/projects";
import { statusLabel, visibilityLabel } from "@/lib/utils";

export type PublicReadinessStatus = "ready" | "todo" | "review";

export type PublicReadinessItem = {
  label: string;
  status: PublicReadinessStatus;
  detail: string;
};

type PublicReadinessCardProps = {
  items: PublicReadinessItem[];
  publicHref?: string;
};

type StatusMeta = {
  label: string;
  Icon: LucideIcon;
  iconClassName: string;
  badgeClassName: string;
};

const statusMeta: Record<PublicReadinessStatus, StatusMeta> = {
  ready: {
    label: "已就绪",
    Icon: CheckCircle2,
    iconClassName: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    badgeClassName: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  },
  todo: {
    label: "建议补齐",
    Icon: AlertTriangle,
    iconClassName: "bg-amber-50 text-amber-700 ring-amber-100",
    badgeClassName: "bg-amber-50 text-amber-700 ring-amber-100"
  },
  review: {
    label: "人工复核",
    Icon: Info,
    iconClassName: "bg-blue-50 text-blue-700 ring-blue-100",
    badgeClassName: "bg-blue-50 text-blue-700 ring-blue-100"
  }
};

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function hasItems(values?: unknown[] | null) {
  return Boolean(values && values.length > 0);
}

function checked(ok: boolean): PublicReadinessStatus {
  return ok ? "ready" : "todo";
}

function relationCount(assetLinks: AssetLinksForAsset) {
  return assetLinks.outbound.length + assetLinks.inbound.length;
}

function publicHrefFor(path: string, visibility: string, slug?: string | null) {
  return visibility === "public" && hasText(slug) ? `${path}/${slug}` : undefined;
}

export function buildProjectReadinessItems({
  project,
  relatedAssets,
  assetLinks,
  publicAttachmentCount
}: {
  project: ProjectRecord;
  relatedAssets: ProjectRelatedAssets;
  assetLinks: AssetLinksForAsset;
  publicAttachmentCount: number;
}): PublicReadinessItem[] {
  const relatedCount = relatedAssets.knowledgeNotes.length + relatedAssets.publications.length + relationCount(assetLinks);

  return [
    {
      label: "可见性为 public",
      status: checked(project.visibility === "public"),
      detail: `当前为 ${visibilityLabel(project.visibility)}；公开站点只展示 public 项目。`
    },
    {
      label: "公开 URL slug",
      status: checked(hasText(project.slug)),
      detail: hasText(project.slug) ? `公开路径为 /projects/${project.slug}。` : "补齐 slug 后才有稳定公开详情页和访问申请上下文。"
    },
    {
      label: "标题与公开摘要",
      status: checked(hasText(project.title) && hasText(project.summary)),
      detail: "公开首页、列表页、详情页和分享卡片会优先使用标题与项目摘要。"
    },
    {
      label: "标签信息",
      status: checked(hasItems(project.tags)),
      detail: hasItems(project.tags) ? `已记录 ${project.tags.length} 个标签。` : "建议补充研究领域、方法或主题标签，方便访客判断内容范围。"
    },
    {
      label: "研究问题、背景与方法",
      status: checked(hasText(project.research_question) && hasText(project.background) && hasText(project.methodology)),
      detail: "公开详情页依赖这些字段说明项目为什么做、怎么做、当前关注什么。"
    },
    {
      label: "进度说明",
      status: checked(hasText(project.status)),
      detail: `当前状态为 ${statusLabel(project.status)}，进度为 ${project.progress}%。`
    },
    {
      label: "相关公开研究资产",
      status: relatedCount > 0 ? "ready" : "todo",
      detail: relatedCount > 0 ? `已检测到 ${relatedCount} 条项目相关资产关系。` : "建议关联相关 Publication、Knowledge 或 Skill，让公开详情页更像研究脉络。"
    },
    {
      label: "公开附件边界",
      status: publicAttachmentCount > 0 ? "ready" : "review",
      detail: publicAttachmentCount > 0
        ? `已检测到 ${publicAttachmentCount} 个 public 关联附件；公开下载仍必须经过 /public-files/[id]/download。`
        : "如需公开附件，请确认文件 visibility 为 public 且关联到当前 public Project；不需要附件时可保持为空。"
    },
    {
      label: "访问申请入口",
      status: checked(hasText(project.slug)),
      detail: "访问申请只携带当前公开页上下文，不会自动授权或开放 Documents。"
    },
    {
      label: "public 字段人工复核",
      status: "review",
      detail: "发布前检查标题、摘要、正文、标签中没有 private、restricted、Storage 路径、owner_id 或内部备注。"
    }
  ];
}

export function buildPublicationReadinessItems({
  publication,
  relatedProject,
  assetLinks,
  publicAttachmentCount
}: {
  publication: PublicationRecord;
  relatedProject: ProjectRecord | null;
  assetLinks: AssetLinksForAsset;
  publicAttachmentCount: number;
}): PublicReadinessItem[] {
  return [
    {
      label: "可见性为 public",
      status: checked(publication.visibility === "public"),
      detail: `当前为 ${visibilityLabel(publication.visibility)}；公开站点只展示 public 成果。`
    },
    {
      label: "公开 URL slug",
      status: checked(hasText(publication.slug)),
      detail: hasText(publication.slug) ? `公开路径为 /publications/${publication.slug}。` : "补齐 slug 后才有稳定公开详情页和访问申请上下文。"
    },
    {
      label: "标题、类型与摘要",
      status: checked(hasText(publication.title) && hasText(publication.publication_type) && hasText(publication.summary)),
      detail: `成果类型为 ${getPublicationTypeLabel(publication.publication_type)}；公开展示需要清晰摘要。`
    },
    {
      label: "Abstract / 正文说明",
      status: checked(hasText(publication.abstract)),
      detail: "建议补齐 abstract，帮助访客理解研究贡献、方法和结论。"
    },
    {
      label: "发布日期或更新时间",
      status: checked(hasText(publication.published_on) || hasText(publication.updated_at)),
      detail: "公开详情页和 sitemap 可使用日期信息说明内容新旧程度。"
    },
    {
      label: "标签信息",
      status: checked(hasItems(publication.tags)),
      detail: hasItems(publication.tags) ? `已记录 ${publication.tags.length} 个标签。` : "建议补充主题、研究方向或成果类型标签。"
    },
    {
      label: "关联研究项目",
      status: relatedProject || relationCount(assetLinks) > 0 ? "ready" : "todo",
      detail: relatedProject ? `已关联项目：${relatedProject.title}。` : "建议关联来源 Project，让成果回到研究脉络中。"
    },
    {
      label: "公开附件边界",
      status: publicAttachmentCount > 0 ? "ready" : "review",
      detail: publicAttachmentCount > 0
        ? `已检测到 ${publicAttachmentCount} 个 public 关联附件；公开下载仍必须经过 /public-files/[id]/download。`
        : "如需公开论文、报告或补充材料，请确认文件 visibility 为 public 且关联到当前 public Publication。"
    },
    {
      label: "访问申请入口",
      status: checked(hasText(publication.slug)),
      detail: "访问申请只携带当前公开页上下文，不会自动授权或开放 Documents。"
    },
    {
      label: "public 字段人工复核",
      status: "review",
      detail: "发布前检查标题、摘要、abstract、标签中没有 private、restricted、Storage 路径、owner_id 或内部备注。"
    }
  ];
}

export function buildKnowledgeReadinessItems({
  note,
  relatedProject,
  assetLinks
}: {
  note: KnowledgeNoteRecord;
  relatedProject: ProjectRecord | null;
  assetLinks: AssetLinksForAsset;
}): PublicReadinessItem[] {
  return [
    {
      label: "可见性为 public",
      status: checked(note.visibility === "public"),
      detail: `当前为 ${visibilityLabel(note.visibility)}；公开站点只展示 public 知识节点。`
    },
    {
      label: "公开 URL slug",
      status: checked(hasText(note.slug)),
      detail: hasText(note.slug) ? `公开路径为 /knowledge/${note.slug}。` : "补齐 slug 后才有稳定公开详情页和访问申请上下文。"
    },
    {
      label: "标题、分类与摘要",
      status: checked(hasText(note.title) && hasText(note.category) && hasText(note.excerpt)),
      detail: "公开列表页和详情页会使用标题、分类和摘要帮助访客快速判断内容。"
    },
    {
      label: "正文或公开说明",
      status: checked(hasText(note.content)),
      detail: "建议提供足够正文，让 Knowledge 公开页不是只有短摘要。"
    },
    {
      label: "标签或分类信息",
      status: checked(hasText(note.category) || hasItems(note.tags)),
      detail: hasItems(note.tags) ? `已记录 ${note.tags.length} 个标签。` : "至少保留清晰分类；有需要时补充主题标签。"
    },
    {
      label: "关联研究项目",
      status: relatedProject || relationCount(assetLinks) > 0 ? "ready" : "todo",
      detail: relatedProject ? `已关联项目：${relatedProject.title}。` : "建议关联来源 Project，让知识节点回到研究脉络中。"
    },
    {
      label: "访问申请入口",
      status: checked(hasText(note.slug)),
      detail: "访问申请只携带当前公开页上下文，不会自动授权或开放 Documents。"
    },
    {
      label: "Documents 展示边界",
      status: "review",
      detail: "Knowledge 公开详情页不展示 Documents；资料只在管理员后台作为私密附件管理。"
    },
    {
      label: "public 字段人工复核",
      status: "review",
      detail: "发布前检查摘要、正文、标签中没有 private、restricted、Storage 路径、owner_id 或内部备注。"
    }
  ];
}

export function buildSkillReadinessItems({
  skill
}: {
  skill: SkillRecord;
}): PublicReadinessItem[] {
  return [
    {
      label: "可见性为 public",
      status: checked(skill.visibility === "public"),
      detail: `当前为 ${visibilityLabel(skill.visibility)}；公开站点只展示 public Skill。`
    },
    {
      label: "公开 URL slug",
      status: checked(hasText(skill.slug)),
      detail: hasText(skill.slug) ? `公开路径为 /skills/${skill.slug}。` : "补齐 slug 后才有稳定公开详情页和访问申请上下文。"
    },
    {
      label: "名称、分类与公开说明",
      status: checked(hasText(skill.name) && hasText(skill.category) && hasText(skill.description)),
      detail: "公开列表页和详情页会使用这些字段说明 Skill 的定位。"
    },
    {
      label: "使用说明",
      status: checked(hasText(skill.usage_guide) || hasText(skill.content)),
      detail: "建议提供可读的 usage guide 或公开说明，避免访客误解为可下载执行包。"
    },
    {
      label: "适用场景",
      status: checked(hasItems(skill.platforms) || hasText(skill.input_description) || hasText(skill.output_description)),
      detail: "可通过平台、输入说明、输出说明描述这个 Skill 适合什么工作流。"
    },
    {
      label: "访问申请入口",
      status: checked(hasText(skill.slug)),
      detail: "访问申请只携带当前公开页上下文，不会自动授权或开放 Documents。"
    },
    {
      label: "公开说明页边界",
      status: "review",
      detail: "Skill 公开页是说明页，不是 Skill 包下载页；不展示 package 或内部文件。"
    },
    {
      label: "Skill 文件安全边界",
      status: "review",
      detail: "Skill 文件只作为后台资料存储，不展示、不下载、不执行、不安装、不解析。"
    },
    {
      label: "public 字段人工复核",
      status: "review",
      detail: "发布前检查说明、usage guide、输入输出描述中没有 private、restricted、Storage 路径、owner_id 或内部备注。"
    }
  ];
}

export function projectPublicHref(project: ProjectRecord) {
  return publicHrefFor("/projects", project.visibility, project.slug);
}

export function publicationPublicHref(publication: PublicationRecord) {
  return publicHrefFor("/publications", publication.visibility, publication.slug);
}

export function knowledgePublicHref(note: KnowledgeNoteRecord) {
  return publicHrefFor("/knowledge", note.visibility, note.slug);
}

export function skillPublicHref(skill: SkillRecord) {
  return publicHrefFor("/skills", skill.visibility, skill.slug);
}

export function PublicReadinessCard({ items, publicHref }: PublicReadinessCardProps) {
  const automaticItems = items.filter((item) => item.status !== "review");
  const readyCount = automaticItems.filter((item) => item.status === "ready").length;
  const todoCount = automaticItems.filter((item) => item.status === "todo").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const summaryClassName = todoCount > 0
    ? "bg-amber-50 text-amber-700 ring-amber-100"
    : "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return (
    <Card>
      <CardHeader
        title="公开发布准备度"
        description="基于已有字段和关联数量生成的后台运营提示，不会阻止保存。"
        action={<Badge className={summaryClassName}>{readyCount}/{automaticItems.length} 已就绪</Badge>}
      />

      <ul className="space-y-3">
        {items.map((item) => {
          const meta = statusMeta[item.status];
          const Icon = meta.Icon;

          return (
            <li key={item.label} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${meta.iconClassName}`}>
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <Badge className={meta.badgeClassName}>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
        这是运营 checklist：不强校验、不自动修改 visibility、不自动公开附件，也不改变访问申请或下载权限。
        {reviewCount > 0 ? ` 另有 ${reviewCount} 项需要人工复核。` : null}
      </div>

      {publicHref ? (
        <Link href={publicHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
          查看公开页
          <ExternalLink size={15} />
        </Link>
      ) : null}
    </Card>
  );
}
