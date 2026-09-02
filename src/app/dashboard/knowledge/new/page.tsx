import Link from "next/link";
import { createKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { AiDraftHandoffReceiver } from "@/components/forms/ai-draft-handoff-receiver";
import { KnowledgeAiDraftAssistant } from "@/components/forms/asset-ai-draft-assistant";
import { KnowledgeForm } from "@/components/forms/knowledge-form";
import { PageHeader } from "@/components/page-header";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getFormError } from "@/lib/forms";
import { buildKnowledgeTemplateDefaults, knowledgeTemplateOptions, parseKnowledgeTemplateKey } from "@/lib/knowledge-templates";
import { getProjectOptions } from "@/lib/queries/projects";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function templateHref(template: string, projectId?: string) {
  const params = new URLSearchParams({ template });

  if (projectId) {
    params.set("project_id", projectId);
  }

  return `/dashboard/knowledge/new?${params.toString()}`;
}

export default async function NewKnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, projects] = await Promise.all([searchParams, getProjectOptions()]);
  const aiConfig = getAiProviderConfig();
  const template = parseKnowledgeTemplateKey(params.template);
  const requestedProjectId = firstParam(params.project_id);
  const selectedProject = projects.find((project) => project.id === requestedProjectId) ?? null;
  const defaults = template ? buildKnowledgeTemplateDefaults(template, selectedProject) : null;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Knowledge Base" title="新建知识笔记" description="保存真实 Markdown 笔记，可选关联研究项目。" />
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">从模板开始</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">模板只预填表单，不会自动保存；新笔记仍默认私密。</p>
            </div>
            {template ? <Link href="/dashboard/knowledge/new" className="text-sm font-semibold text-blue-700">清空模板</Link> : null}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {knowledgeTemplateOptions.map((option) => (
              <Link
                key={option.key}
                href={templateHref(option.key, selectedProject?.id)}
                className={`rounded-2xl border p-4 transition ${template === option.key ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/70"}`}
              >
                <p className="text-sm font-semibold text-slate-950">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
              </Link>
            ))}
          </div>
        </section>
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
          <KnowledgeForm action={createKnowledgeAction} projects={projects} defaults={defaults} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
