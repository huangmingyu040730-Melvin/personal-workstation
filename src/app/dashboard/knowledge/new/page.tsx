import { createKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { AiDraftHandoffReceiver } from "@/components/forms/ai-draft-handoff-receiver";
import { KnowledgeAiDraftAssistant } from "@/components/forms/asset-ai-draft-assistant";
import { KnowledgeForm } from "@/components/forms/knowledge-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getFormError } from "@/lib/forms";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function NewKnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, projects] = await Promise.all([searchParams, getProjectOptions()]);
  const aiConfig = getAiProviderConfig();

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Knowledge Base" title="新建知识笔记" description="保存真实 Markdown 笔记，可选关联研究项目。" />
        <AdminFormSurface
          sidebar={
            <>
              <KnowledgeAiDraftAssistant
                formId="knowledge-form"
                isConfigured={aiConfig.isConfigured}
                providerLabel={getAiProviderDisplayName(aiConfig.provider)}
                model={aiConfig.model}
              />
              <AdminFormHelpCard
                title="知识文章建议"
                description="适合沉淀可公开复用的方法、工具、框架和学习笔记。"
                items={["摘要会用于列表和公开卡片。", "正文支持 Markdown 文本。", "标签有助于后续筛选和内容发现。"]}
              />
              <AdminFormHelpCard
                title="公开边界"
                tone="slate"
                items={["public 文章会被公开列表读取。", "featured 文章会进入首页精选区域。", "不要放入未脱敏的会议纪要或内部资料。"]}
              />
            </>
          }
        >
          <AiDraftHandoffReceiver targetType="knowledge" formId="knowledge-form" />
          <KnowledgeForm action={createKnowledgeAction} projects={projects} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
