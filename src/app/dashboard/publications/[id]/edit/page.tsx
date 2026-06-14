import { notFound } from "next/navigation";
import { updatePublicationAction } from "@/actions/publications";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { PublicationForm } from "@/components/forms/publication-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getPublicationById } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function EditPublicationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, projects] = await Promise.all([params, searchParams, getProjectOptions()]);
  const publication = await getPublicationById(id);

  if (!publication) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Publications" title="编辑学术成果" description="保存后会刷新成果详情、Dashboard 与公开首页数据。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="编辑成果"
                description="成果会同时影响后台列表、Dashboard 统计和公开成果页。"
                items={["slug 变更会影响公开详情页地址。", "featured 只用于公开首页精选展示。", "private 与 unlisted 不进入公开列表。"]}
              />
              <AdminFormHelpCard
                title="内容复核"
                tone="slate"
                items={["确认没有客户名称、内部数据或敏感附件链接。", "摘要建议保留方法论和结论边界。", "文件下载入口只在后台展示。"]}
              />
            </>
          }
        >
          <PublicationForm action={updatePublicationAction.bind(null, publication.id)} publication={publication} projects={projects} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
