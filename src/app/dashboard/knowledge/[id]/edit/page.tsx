import { notFound } from "next/navigation";
import { updateKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { KnowledgeForm } from "@/components/forms/knowledge-form";
import { PageHeader } from "@/components/page-header";
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

  if (!note) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Knowledge Base" title="编辑知识笔记" description="保存后会刷新知识库列表与 Dashboard 最近笔记。" />
        <AdminFormSurface>
          <KnowledgeForm action={updateKnowledgeAction.bind(null, note.id)} note={note} projects={projects} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
