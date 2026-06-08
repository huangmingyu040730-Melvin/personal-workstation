import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { RestrictedAccessNotice } from "@/components/public/restricted-access-notice";
import { formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicSkillBySlug, getViewableSkillBySlug } from "@/lib/queries/skills";
import { publicPageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getPublicSkillBySlug(slug);

  if (!skill) {
    return {
      title: "Skill 库 | 黄铭语",
      description: "公开 Skill 不存在或未公开。",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return publicPageMetadata({
    title: `${skill.name} | 黄铭语`,
    description: skill.description,
    path: `/skills/${skill.slug}`,
    type: "article"
  });
}

export default async function PublicSkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getViewableSkillBySlug(slug);

  if (!skill) {
    return (
      <PublicShell>
        <PublicPageHero eyebrow="Restricted Access" title="Skill 需要授权访问" description="这条 Skill 可能尚未公开，或需要管理员按邮箱授权后才能查看。" />
        <RestrictedAccessNotice loginHref={`/viewer/login?next=${encodeURIComponent(`/skills/${slug}`)}`} />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <PublicPageHero eyebrow={skill.category} title={skill.name} description={skill.description} />
      <section className="mx-auto grid max-w-[1680px] gap-6 px-5 py-10 lg:grid-cols-[minmax(0,0.98fr)_0.38fr] lg:px-12 2xl:px-16">
        <div className="space-y-5">
          <Link href="/skills" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            <ArrowLeft size={16} />
            返回公开 Skill
          </Link>
          {skill.content?.trim() ? <Card><CardHeader title="详细说明" /><MarkdownPreview content={skill.content} /></Card> : null}
          {skill.input_description?.trim() ? <Card><CardHeader title="输入内容说明" /><MarkdownPreview content={skill.input_description} /></Card> : null}
          {skill.output_description?.trim() ? <Card><CardHeader title="输出内容说明" /><MarkdownPreview content={skill.output_description} /></Card> : null}
          {skill.usage_guide?.trim() ? <Card><CardHeader title="使用指南" /><MarkdownPreview content={skill.usage_guide} /></Card> : null}
          {skill.skill_md_content?.trim() ? <Card><CardHeader title="SKILL.md" /><MarkdownPreview content={skill.skill_md_content} /></Card> : null}
          {!skill.content?.trim() && !skill.input_description?.trim() && !skill.output_description?.trim() && !skill.usage_guide?.trim() && !skill.skill_md_content?.trim() ? (
            <Card>
              <CardHeader title="公开说明" />
              <p className="text-sm leading-7 text-stone-600">该 Skill 的详细使用说明仍在整理中。当前页面先展示公开名称、简介、状态、平台和版本信息。</p>
            </Card>
          ) : null}
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Skill 状态" />
            <div className="flex items-center justify-between">
              <StatusBadge status={skill.status} />
              <span className="text-sm font-semibold text-navy-950">{skill.current_version ?? "未设版本"}</span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-stone-500">精选</dt><dd className="font-medium text-stone-800">{skill.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-stone-500">更新</dt><dd className="font-medium text-stone-800">{formatDateTime(skill.updated_at)}</dd></div>
            </dl>
            {skill.repository_url ? <Link href={skill.repository_url} target="_blank" rel="noreferrer" className="mt-5 block text-sm font-medium text-blue-700">打开公开仓库</Link> : null}
          </Card>
          <Card>
            <CardHeader title="使用平台" />
            <div className="flex flex-wrap gap-2">
              {skill.platforms.map((platform) => <span key={platform} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{platform}</span>)}
            </div>
          </Card>
          <Card>
            <CardHeader title="公开边界" />
            <p className="text-sm leading-7 text-stone-600">本页不展示后台版本记录、内部日志或私密附件。只有明确设置为公开的 Skill 字段会出现在这里。</p>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
