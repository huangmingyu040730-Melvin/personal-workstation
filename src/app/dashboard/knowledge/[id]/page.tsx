import { notFound } from "next/navigation";
import { deleteKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { KnowledgeNodeHub } from "@/components/knowledge/knowledge-node-hub";
import { getFormError } from "@/lib/forms";
import { getKnowledgeNoteById } from "@/lib/queries/knowledge";
import { getProjectById } from "@/lib/queries/projects";
import { getPublicationsByProjectId } from "@/lib/queries/publications";

export default async function KnowledgeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const note = await getKnowledgeNoteById(id);

  if (!note) {
    notFound();
  }

  const [relatedProject, relatedPublications] = note.project_id
    ? await Promise.all([getProjectById(note.project_id), getPublicationsByProjectId(note.project_id, 5)])
    : [null, []];
  const deleteAction = deleteKnowledgeAction.bind(null, note.id);
  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";

  return (
    <AppShell>
      <AdminPageSurface>
        <KnowledgeNodeHub
          note={note}
          relatedProject={relatedProject}
          relatedPublications={relatedPublications}
          deleteAction={deleteAction}
          error={error}
          notice={notice}
        />
      </AdminPageSurface>
    </AppShell>
  );
}
