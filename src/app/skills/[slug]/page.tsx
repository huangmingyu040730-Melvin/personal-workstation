import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/badge";
import { PublicDetailBody, PublicDetailGrid, PublicDetailHero, PublicDetailMetaList, PublicDetailSection, PublicDetailTags, PublicRelatedContent, type PublicDetailChip, type PublicRelatedItem } from "@/components/public/public-detail-shell";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { skillStatuses } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicSkillBySlug, getRelatedPublicSkills } from "@/lib/queries/skills";
import { publicMetadataDescription, publicPageMetadata } from "@/lib/site";

function getSkillStatusLabel(value: string) {
  return skillStatuses.find((status) => status.value === value)?.label ?? value;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getPublicSkillBySlug(slug);

  if (!skill) {
    return {
      title: "Skill 库",
      description: "公开 Skill 不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: skill.name,
    description: publicMetadataDescription(skill.description),
    path: `/skills/${skill.slug}`,
    type: "article"
  });
}

export default async function PublicSkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getPublicSkillBySlug(slug);

  if (!skill) {
    return (
      <PublicShell>
        <PublicPageHero eyebrow="Access Request" title="Skill 暂未公开" description="这条 Skill 可能尚未公开，或需要管理员按邮箱授权后才能查看。公开页面不会泄露私密包、附件或内部版本记录。" />
        <RestrictedAccessNotice loginHref={`/viewer/login?next=${encodeURIComponent(`/skills/${slug}`)}`} />
      </PublicShell>
    );
  }

  const relatedSkills = await getRelatedPublicSkills(skill, 4);
  const statusLabel = getSkillStatusLabel(skill.status);
  const heroChips: PublicDetailChip[] = [
    { label: skill.category, tone: "blue" },
    { label: statusLabel, tone: "green" },
    { label: skill.current_version ?? "未设版本", tone: "slate" },
    ...skill.platforms.slice(0, 3).map((platform) => ({ label: platform, tone: "slate" as const }))
  ];
  const relatedSkillItems: PublicRelatedItem[] = relatedSkills.map((item) => ({
    href: `/skills/${item.slug}`,
    title: item.name,
    meta: `${item.category} · ${getSkillStatusLabel(item.status)}`,
    description: item.description,
    ctaLabel: "查看 Skill"
  }));
  const hasAnyGuide = Boolean(
    skill.content?.trim() ||
    skill.input_description?.trim() ||
    skill.output_description?.trim() ||
    skill.usage_guide?.trim()
  );

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="AI Skill / Workflow"
        title={skill.name}
        description={skill.description}
        chips={heroChips}
        backHref="/skills"
        backLabel="返回 Skill 库"
      />
      <PublicDetailBody>
        <PublicDetailGrid
          main={(
            <>
              {skill.content?.trim() ? (
                <PublicDetailSection title="工作流说明" description="公开层面的 Skill 目标、适用场景与方法。">
                  <MarkdownPreview content={skill.content} />
                </PublicDetailSection>
              ) : null}
              {skill.input_description?.trim() ? (
                <PublicDetailSection title="输入内容" description="使用这个工作流时需要准备的公开说明。">
                  <MarkdownPreview content={skill.input_description} />
                </PublicDetailSection>
              ) : null}
              {skill.output_description?.trim() ? (
                <PublicDetailSection title="输出内容" description="该工作流预期产出的公开说明。">
                  <MarkdownPreview content={skill.output_description} />
                </PublicDetailSection>
              ) : null}
              {skill.usage_guide?.trim() ? (
                <PublicDetailSection title="使用指南" description="公开可读的流程说明，不包含私密包或执行入口。">
                  <MarkdownPreview content={skill.usage_guide} />
                </PublicDetailSection>
              ) : null}
              {!hasAnyGuide ? (
                <PublicDetailSection title="公开说明">
                  <p className="text-sm leading-7 text-slate-600">该 Skill 的详细使用说明仍在整理中。当前页面先展示公开名称、简介、状态、平台和版本信息。</p>
                </PublicDetailSection>
              ) : null}
            </>
          )}
          aside={(
            <>
              <PublicDetailSection title="Skill 状态">
                <div className="flex items-center justify-between gap-4">
                  <StatusBadge status={skill.status} />
                  <span className="text-sm font-semibold text-navy-950">{skill.current_version ?? "未设版本"}</span>
                </div>
                <div className="mt-5">
                  <PublicDetailMetaList
                    items={[
                      { label: "分类", value: skill.category },
                      { label: "精选", value: skill.is_featured ? "是" : "否" },
                      { label: "更新", value: formatDateTime(skill.updated_at) }
                    ]}
                  />
                </div>
                {skill.repository_url ? (
                  <Link href={skill.repository_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                    打开公开仓库
                  </Link>
                ) : null}
              </PublicDetailSection>
              <PublicDetailSection title="使用平台">
                <PublicDetailTags tags={skill.platforms} emptyLabel="暂无平台信息" />
              </PublicDetailSection>
              <PublicDetailSection title="公开边界">
                <p className="text-sm leading-7 text-slate-600">
                  本页是公开说明页，不是 Skill 包下载入口。页面不展示私密附件、文件中心资料、内部文件地址、临时下载地址、后台版本记录，也不会执行、安装或解析 Skill 文件。
                </p>
                <Link href="/access-request" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                  申请查看未公开材料
                </Link>
              </PublicDetailSection>
            </>
          )}
        />
        <div className="mt-6">
          <PublicRelatedContent
            title="相关公开 Skill"
            description="基于公开分类、平台和状态推荐，不读取或展示私密 Skill 包。"
            items={relatedSkillItems}
            emptyText="暂无相关公开 Skill。"
            browseHref="/skills"
            browseLabel="浏览 Skill 库"
          />
        </div>
      </PublicDetailBody>
    </PublicShell>
  );
}
