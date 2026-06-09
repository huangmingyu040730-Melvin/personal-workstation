import { notFound } from "next/navigation";
import { updateResumeItemAction } from "@/actions/resume";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ResumeItemForm } from "@/components/forms/resume-item-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getResumeItemById, getResumeRelationOptions } from "@/lib/queries/resume";

export default async function EditResumeItemPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, options] = await Promise.all([params, searchParams, getResumeRelationOptions()]);
  const item = await getResumeItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Resume Library" title="编辑简历素材" description="修改后会刷新简历素材库、详情页和 Dashboard 概览。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="编辑检查"
                description="简历素材可以长期维护，建议每次更新都确认是否仍适合公开或重点标记。"
                items={["visibility 默认保持 private。", "不要加入客户隐私、证件号或私人联系方式。", "bullet 可拆分为多条，方便后续按岗位重组。"]}
              />
              <AdminFormHelpCard
                title="后续阶段"
                tone="slate"
                items={["Phase 2K-B 才会做简历版本组合。", "Phase 2K-C 才会做 PDF / Word 导出。", "Phase 2K-D 才会做 AI JD 优化。"]}
              />
            </>
          }
        >
          <ResumeItemForm action={updateResumeItemAction.bind(null, item.id)} item={item} options={options} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
