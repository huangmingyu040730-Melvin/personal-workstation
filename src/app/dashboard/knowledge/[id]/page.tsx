import { notFound } from "next/navigation";
import { deleteKnowledgeAction } from "@/actions/knowledge";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { KnowledgeNodeHub } from "@/components/knowledge/knowledge-node-hub";
import { getFormError } from "@/lib/forms";
import { getAssetLinksForAsset, getAssetLinkTargetOptions } from "@/lib/queries/asset-links";
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

  const [relatedProject, relatedPublications, assetLinks, assetLinkOptions] = await Promise.all([
    note.project_id ? getProjectById(note.project_id) : Promise.resolve(null),
    note.project_id ? getPublicationsByProjectId(note.project_id, 5) : Promise.resolve([]),
    getAssetLinksForAsset("knowledge", note.id),
    getAssetLinkTargetOptions()
  ]);
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
          assetLinks={assetLinks}
          assetLinkOptions={assetLinkOptions}
          deleteAction={deleteAction}
          error={error}
          notice={notice}
        />
      </AdminPageSurface>
    </AppShell>
  );
}
