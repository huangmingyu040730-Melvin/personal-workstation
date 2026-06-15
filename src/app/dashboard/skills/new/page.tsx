import { createSkillAction } from "@/actions/skills";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { SkillAiDraftAssistant } from "@/components/forms/asset-ai-draft-assistant";
import { SkillForm } from "@/components/forms/skill-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getFormError } from "@/lib/forms";

export default async function NewSkillPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const aiConfig = getAiProviderConfig();

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Skills Library" title="新建 Skill" description="创建真实 Skill 记录，可同时生成第一条版本记录。" />
        <AdminFormSurface
          sidebar={
            <>
              <SkillAiDraftAssistant
                formId="skill-form"
                isConfigured={aiConfig.isConfigured}
                providerLabel={getAiProviderDisplayName(aiConfig.provider)}
                model={aiConfig.model}
              />
              <AdminFormHelpCard
                title="Skill 录入建议"
                description="Skill 更适合记录固定输入、输出和使用步骤，而不是一次性 prompt。"
                items={["平台字段可记录 ChatGPT、Codex、GitHub Actions 等。", "输入和输出说明越清晰，复用成本越低。", "初始版本记录会帮助后续维护。"]}
              />
              <AdminFormHelpCard
                title="发布判断"
                tone="slate"
                items={["可公开的 Skill 不应包含私密素材或内部流程。", "可用状态表示已经能被稳定复用。", "规划中 Skill 可以保持 public 但不 featured。"]}
              />
            </>
          }
        >
          <SkillForm action={createSkillAction} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
