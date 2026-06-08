import { createKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { KnowledgeForm } from "@/components/forms/knowledge-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function NewKnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, projects] = await Promise.all([searchParams, getProjectOptions()]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Knowledge Base" title="新建知识笔记" description="保存真实 Markdown 笔记，可选关联研究项目。" />
        <AdminFormSurface>
          <KnowledgeForm action={createKnowledgeAction} projects={projects} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
