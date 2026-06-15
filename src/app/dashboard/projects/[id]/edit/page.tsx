import { notFound } from "next/navigation";
import { updateProjectAction } from "@/actions/projects";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ProjectAiDraftAssistant } from "@/components/forms/project-ai-draft-assistant";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getFormError } from "@/lib/forms";
import { getProjectById } from "@/lib/queries/projects";

export default async function EditProjectPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = await getProjectById(id);
  const aiConfig = getAiProviderConfig();

  if (!project) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Projects" title="编辑研究项目" description="保存后会刷新项目详情、Dashboard 与公开首页数据。" />
        <AdminFormSurface
          sidebar={
            <>
              <ProjectAiDraftAssistant
                formId="project-form"
                isConfigured={aiConfig.isConfigured}
                providerLabel={getAiProviderDisplayName(aiConfig.provider)}
                model={aiConfig.model}
              />
              <AdminFormHelpCard
                title="编辑检查"
                description="保存后会刷新项目详情、Dashboard 与公开展示数据。"
                items={["修改 visibility 前先确认公开边界。", "进度建议保持 0-100 的整数。", "研究内容支持 Markdown 文本展示。"]}
              />
              <AdminFormHelpCard
                title="公开展示"
                tone="emerald"
                items={["public 项目可进入公开列表。", "featured 项目会优先出现在首页。", "private 项目不会被访客看到。"]}
              />
            </>
          }
        >
          <ProjectForm action={updateProjectAction.bind(null, project.id)} project={project} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
