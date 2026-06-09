import { notFound } from "next/navigation";
import { updateResumeVersionAction } from "@/actions/resume";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ResumeVersionForm } from "@/components/forms/resume-version-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getAllResumeItemsForVersionBuilder, getResumeVersionWithItems } from "@/lib/queries/resume";

export default async function EditResumeVersionPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, resumeItems] = await Promise.all([params, searchParams, getAllResumeItemsForVersionBuilder()]);
  const version = await getResumeVersionWithItems(id);

  if (!version) {
    notFound();
  }

  const action = updateResumeVersionAction.bind(null, version.id);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Resume Versions" title="编辑简历版本" description="调整版本信息、素材选择、区块和排序。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="编辑提醒"
                description="保存会覆盖当前版本的素材组合配置，但不会修改原始素材。"
                items={["取消勾选会从当前版本移除素材。", "展示开关只影响当前版本预览。", "排序和区块可随时调整。"]}
              />
              <AdminFormHelpCard
                title="隐私边界"
                tone="emerald"
                items={["版本默认 private。", "本阶段不提供公开简历页面。", "不要填写证件号、私人地址或密钥。"]}
              />
            </>
          }
        >
          <ResumeVersionForm action={action} version={version} versionItems={version.resume_version_items} resumeItems={resumeItems} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
