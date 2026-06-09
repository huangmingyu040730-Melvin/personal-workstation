import { createResumeVersionAction } from "@/actions/resume";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ResumeVersionForm } from "@/components/forms/resume-version-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getAllResumeItemsForVersionBuilder } from "@/lib/queries/resume";

export default async function NewResumeVersionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, resumeItems] = await Promise.all([searchParams, getAllResumeItemsForVersionBuilder()]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Resume Versions" title="新建简历版本" description="选择素材、设置区块与排序，保存为一个可预览的简历版本。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="版本组合建议"
                description="版本适合对应一个明确岗位或申请场景。"
                items={["先选核心经历，再补教育、技能和证书。", "排序值越小越靠前。", "同一素材可以出现在多个版本中。"]}
              />
              <AdminFormHelpCard
                title="本阶段边界"
                tone="emerald"
                items={["只做后台保存与预览。", "不会生成 PDF 或 Word。", "不会创建公开简历页面或分享链接。"]}
              />
            </>
          }
        >
          <ResumeVersionForm action={createResumeVersionAction} resumeItems={resumeItems} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
