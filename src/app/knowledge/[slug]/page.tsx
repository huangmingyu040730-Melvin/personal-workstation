import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/card";
import { PublicPageHero, PublicShell } from "@/components/public/public-shell";
import { formatDateTime } from "@/lib/format";
import { MarkdownPreview } from "@/lib/markdown";
import { getPublicKnowledgeNoteBySlug } from "@/lib/queries/knowledge";

export default async function PublicKnowledgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getPublicKnowledgeNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <PublicShell>
      <PublicPageHero eyebrow={note.category} title={note.title} description={note.excerpt ?? "公开知识文章"} />
      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-8 lg:grid-cols-[1fr_0.35fr] lg:px-8">
        <div className="space-y-5">
          <Link href="/knowledge" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            <ArrowLeft size={16} />
            返回公开知识库
          </Link>
          <Card>
            <CardHeader title="正文" />
            <MarkdownPreview content={note.content} />
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="文章信息" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">分类</dt><dd className="font-medium text-slate-800">{note.category}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">关联项目</dt><dd className="font-medium text-slate-800">{note.projects?.title ?? "未公开关联"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">更新</dt><dd className="font-medium text-slate-800">{formatDateTime(note.updated_at)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="标签" />
            <div className="flex flex-wrap gap-2">
              {note.tags.length > 0 ? note.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tag}</span>) : <p className="text-sm text-slate-500">暂无标签</p>}
            </div>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
