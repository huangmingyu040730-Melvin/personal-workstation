import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge, VisibilityBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { publications } from "@/lib/mock-data";

export default function PublicationsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Publications"
        title="学术成果"
        description="管理报告、论文草稿和分析成果，区分公开、私密与链接可见的发布状态。"
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {publications.map((publication) => (
          <Card key={publication.id} className="flex flex-col">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileText size={24} />
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge status="已发布" />
              <VisibilityBadge visibility={publication.visibility} />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{publication.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{publication.type} · {publication.date}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{publication.summary}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {publication.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
