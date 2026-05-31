import { BookOpen, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { knowledgeNotes } from "@/lib/mock-data";

export default function KnowledgePage() {
  const selected = knowledgeNotes[1];
  const categories = Array.from(new Set(knowledgeNotes.map((note) => note.category)));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Knowledge Base"
        title="知识库"
        description="沉淀研究笔记、工具接口、会议方法和可复用思维框架。"
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span key={category} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">{category}</span>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="笔记列表" />
          <div className="space-y-3">
            {knowledgeNotes.map((note) => (
              <div key={note.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <BookOpen className="mt-1 text-emerald-600" size={18} />
                  <div>
                    <p className="font-medium text-slate-900">{note.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{note.category} · {note.updatedAt}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400" size={18} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="笔记详情样式" action={<VisibilityBadge visibility={selected.visibility} />} />
          <h2 className="text-2xl font-semibold text-slate-950">{selected.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{selected.excerpt}</p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900">核心提纲</h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>1. 明确概念定义与使用场景。</li>
              <li>2. 整理常用数据字段、输入输出和质量检查。</li>
              <li>3. 保留后续关联项目、成果和 Skill 的结构化入口。</li>
            </ol>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {selected.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tag}</span>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
