import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { AiRawNoteDraftLab } from "@/components/ai-drafts/ai-raw-note-draft-lab";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";

export default function AiDraftsPage() {
  const aiConfig = getAiProviderConfig();

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="AI Draft Lab"
          title="AI 草稿实验室"
          description="把原始想法、研究笔记、会议摘录或粗糙文本转换成 Project / Publication / Knowledge / Skill 结构化草稿。"
        />

        <AdminSecurityNote>
          AI 草稿实验室只在管理员后台可用，只接收目标类型和原始文本；不会自动创建数据库记录，不会保存草稿，不会读取 Documents / Storage，也不会生成下载链接。
        </AdminSecurityNote>

        <AiRawNoteDraftLab
          isConfigured={aiConfig.isConfigured}
          providerLabel={getAiProviderDisplayName(aiConfig.provider)}
          model={aiConfig.model}
        />
      </AdminPageSurface>
    </AppShell>
  );
}
