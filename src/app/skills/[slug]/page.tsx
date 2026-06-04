import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicSkillBySlug } from "@/lib/queries/skills";

export default async function PublicSkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getPublicSkillBySlug(slug);

  if (!skill) {
    notFound();
  }

  return (
    <PublicShell>
      <PublicPageHero eyebrow={skill.category} title={skill.name} description={skill.description} />
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-8 lg:grid-cols-[1fr_0.38fr] lg:px-8">
        <div className="space-y-5">
          <Link href="/skills" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
            <ArrowLeft size={16} />
            返回公开 Skill
          </Link>
          <Card><CardHeader title="详细说明" /><MarkdownPreview content={skill.content} /></Card>
          <Card><CardHeader title="输入内容说明" /><MarkdownPreview content={skill.input_description} emptyText="暂无公开输入说明。" /></Card>
          <Card><CardHeader title="输出内容说明" /><MarkdownPreview content={skill.output_description} emptyText="暂无公开输出说明。" /></Card>
          <Card><CardHeader title="使用指南" /><MarkdownPreview content={skill.usage_guide} emptyText="暂无公开使用指南。" /></Card>
          {skill.skill_md_content ? <Card><CardHeader title="SKILL.md" /><MarkdownPreview content={skill.skill_md_content} /></Card> : null}
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Skill 状态" />
            <div className="flex items-center justify-between">
              <StatusBadge status={skill.status} />
              <span className="text-sm font-semibold text-slate-800">{skill.current_version ?? "未设版本"}</span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">精选</dt><dd className="font-medium text-slate-800">{skill.is_featured ? "是" : "否"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(skill.updated_at)}</dd></div>
            </dl>
            {skill.repository_url ? <Link href={skill.repository_url} className="mt-5 block text-sm font-medium text-blue-700">打开公开仓库</Link> : null}
          </Card>
          <Card>
            <CardHeader title="使用平台" />
            <div className="flex flex-wrap gap-2">
              {skill.platforms.map((platform) => <span key={platform} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{platform}</span>)}
            </div>
          </Card>
          <Card>
            <CardHeader title="公开边界" />
            <p className="text-sm leading-7 text-slate-600">本页不展示后台版本记录、内部日志或私密附件。只有明确设置为公开的 Skill 字段会出现在这里。</p>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
