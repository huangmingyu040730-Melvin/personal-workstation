import { readFileSync } from "node:fs";
import PizZip from "pizzip";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, FileDown, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { PageHeader } from "@/components/page-header";
import { ResumeQualityPreviewNotice } from "@/components/resume-quality";
import { ResumePrintButton } from "@/components/resume-print-button";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems, getResumeVersionWithItems } from "@/lib/queries/resume";
import { analyzeResumeVersionQuality } from "@/lib/resume-quality";
import { buildResumeTemplateModel } from "@/lib/resume-template-model";
import { ResumePaper } from "@/components/resume-paper";
import { ResumeReferencePreview } from "@/components/resume-reference-preview";
import { getReferenceSnapshot, isReferenceResume, referenceResumeTemplatePath } from "@/lib/resume-reference";

export default async function ResumeVersionPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [version, publicProfile, basicItems] = await Promise.all([
    getResumeVersionWithItems(id),
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);

  if (!version) {
    notFound();
  }

  const profile = publicProfile ?? getProfileFallback();
  const visibleItems = version.resume_version_items.filter((item) => item.is_visible && item.resume_items);
  const selectedBasicItem = visibleItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
  const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  const basicItem = selectedBasicItem ?? latestBasicItem;
  const quality = analyzeResumeVersionQuality({ version, versionItems: version.resume_version_items, profile, basicItem });
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const usesReference = isReferenceResume(version);
  const snapshot = usesReference ? getReferenceSnapshot({ version, profile, basicItem }, new PizZip(readFileSync(referenceResumeTemplatePath)).file("word/document.xml")!.asText()) : null;

  return (
    <AppShell>
      <AdminPageSurface className="resume-preview-page">
        <div className="resume-preview-toolbar">
          <PageHeader
            eyebrow="Resume Preview"
            title={`${version.title} · 简历预览`}
            description={snapshot ? "原版 PDF 与当前简历内容一致，按原始 A4 版式展示。Word 导出保留原文件的文字格式、表格和照片位置。" : "当前所选素材已按原版结构组织。导出 Word 将直接套用你的原始模板，可编辑并继续复用。"}
            action={
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/resume/versions/${version.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <ArrowLeft size={16} />
                  返回详情
                </Link>
                <Link href={`/dashboard/resume/versions/${version.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  <Edit size={16} />
                  编辑版本
                </Link>
                <Link href={`/dashboard/resume/versions/${version.id}/jd-review`} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
                  <Sparkles size={16} />
                  AI JD 优化
                </Link>
                <Link href={`/dashboard/resume/versions/${version.id}/export/docx`} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100">
                  <FileDown size={16} />
                  导出 Word
                </Link>
                <ResumePrintButton />
              </div>
            }
          />

          <AdminSecurityNote>
            {snapshot ? "当前原版预览已经与所选素材及字段开关核对。修改内容后会自动停用过期的 PDF 预览，Word 仍按原始模板生成。" : "网页用于检查选材和字段；字体及分页以原版 Word 导出为准。每次导出都读取最新素材，内容增多时自动续页。"}
          </AdminSecurityNote>

          <ResumeQualityPreviewNotice report={quality} />
        </div>

        <div className="resume-paper-wrap">
          {snapshot ? <ResumeReferencePreview image={snapshot.image} pdf={snapshot.pdf} /> : <ResumePaper model={model} />}
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}
