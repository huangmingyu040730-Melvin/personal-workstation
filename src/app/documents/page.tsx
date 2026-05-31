import { Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  const categories = ["全部", ...Array.from(new Set(documents.map((doc) => doc.category)))];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Documents"
        title="文件中心"
        description="第一阶段实现文件列表、分类筛选和上传按钮样式，真实上传将在后续接入。"
        action={
          <button className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Upload size={18} />
            上传文件
          </button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button key={category} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-blue-200 hover:text-blue-700">
            {category}
          </button>
        ))}
      </div>
      <Card className="overflow-x-auto p-0">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.2fr_0.5fr_0.4fr_0.5fr_0.3fr] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500">
            <span>文件名</span>
            <span>分类</span>
            <span>大小</span>
            <span>更新时间</span>
            <span>权限</span>
          </div>
          {documents.map((doc) => (
            <div key={doc.id} className="grid grid-cols-[1.2fr_0.5fr_0.4fr_0.5fr_0.3fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0">
              <span className="font-medium text-slate-900">{doc.name}</span>
              <span className="text-slate-600">{doc.category}</span>
              <span className="text-slate-500">{doc.size}</span>
              <span className="text-slate-500">{doc.updatedAt}</span>
              <VisibilityBadge visibility={doc.visibility} />
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
