import { notFound } from "next/navigation";
import { updateKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { KnowledgeAiDraftAssistant } from "@/components/forms/asset-ai-draft-assistant";
import { KnowledgeForm } from "@/components/forms/knowledge-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getFormError } from "@/lib/forms";
import { getKnowledgeNoteById } from "@/lib/queries/knowledge";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function EditKnowledgePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, projects] = await Promise.all([params, searchParams, getProjectOptions()]);
  const note = await getKnowledgeNoteById(id);
  const aiConfig = getAiProviderConfig();

  if (!note) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Knowledge Base" title="编辑知识笔记" description="保存后会刷新知识库列表与 Dashboard 最近笔记。" />
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
                title="编辑知识笔记"
                description="保存后会刷新知识库、Dashboard 最近笔记和公开内容。"
                items={["更新分类和标签前先确认检索体验。", "公开文章建议保留清晰摘要。", "Markdown 会以安全文本方式展示。"]}
              />
              <AdminFormHelpCard
                title="内容质量"
                tone="emerald"
                items={["一篇文章聚焦一个主题。", "优先沉淀可复用方法论。", "引用外部事实时保留来源意识。"]}
              />
            </>
          }
        >
          <KnowledgeForm action={updateKnowledgeAction.bind(null, note.id)} note={note} projects={projects} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
