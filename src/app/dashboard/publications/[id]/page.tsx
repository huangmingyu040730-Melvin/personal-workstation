import { notFound } from "next/navigation";
import { deletePublicationAction } from "@/actions/publications";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { PublicationOutputHub } from "@/components/publications/publication-output-hub";
import { getFormError } from "@/lib/forms";
import { getKnowledgeNotesByProjectId } from "@/lib/queries/knowledge";
import { getProjectById } from "@/lib/queries/projects";
import { getPublicationById } from "@/lib/queries/publications";

export default async function PublicationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const publication = await getPublicationById(id);

  if (!publication) {
    notFound();
  }

  const [relatedProject, relatedKnowledge] = publication.project_id
    ? await Promise.all([getProjectById(publication.project_id), getKnowledgeNotesByProjectId(publication.project_id, 5)])
    : [null, []];

  return (
    <AppShell>
      <AdminPageSurface>
        <PublicationOutputHub
          publication={publication}
          relatedProject={relatedProject}
          relatedKnowledge={relatedKnowledge}
          deleteAction={deletePublicationAction.bind(null, publication.id)}
          error={getFormError(query)}
          notice={query.notice === "collection_deleted"}
        />
      </AdminPageSurface>
    </AppShell>
  );
}
