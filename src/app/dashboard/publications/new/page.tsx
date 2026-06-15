import { createPublicationAction } from "@/actions/publications";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { PublicationAiDraftAssistant } from "@/components/forms/asset-ai-draft-assistant";
import { PublicationForm } from "@/components/forms/publication-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getFormError } from "@/lib/forms";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function NewPublicationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, projects] = await Promise.all([searchParams, getProjectOptions()]);
  const aiConfig = getAiProviderConfig();

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Publications" title="新建学术成果" description="创建真实成果记录，保存后会写入 Supabase publications 表。" />
        <AdminFormSurface
          sidebar={
            <>
              <PublicationAiDraftAssistant
                formId="publication-form"
                isConfigured={aiConfig.isConfigured}
                providerLabel={getAiProviderDisplayName(aiConfig.provider)}
                model={aiConfig.model}
              />
              <AdminFormHelpCard
                title="成果录入建议"
                description="适合沉淀研究报告、阶段总结、策略方法论和数据分析成果。"
                items={["发布日期可留空，但公开成果建议填写。", "关联项目能让成果详情更完整。", "摘要支持 Markdown，避免粘贴敏感原文。"]}
              />
              <AdminFormHelpCard
                title="附件提醒"
                tone="slate"
                items={["附件请在文件中心上传。", "新附件默认私密；如需公开下载，需在文件中心显式设为公开。", "有附件关联时删除成果会被保护。"]}
              />
            </>
          }
        >
          <PublicationForm action={createPublicationAction} projects={projects} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
