import { notFound } from "next/navigation";
import { deleteProjectAction } from "@/actions/projects";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { ProjectResearchHub } from "@/components/projects/project-research-hub";
import { getFormError } from "@/lib/forms";
import { getProjectById, getProjectRelatedAssets } from "@/lib/queries/projects";

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const relatedAssets = await getProjectRelatedAssets(project.id);
  const deleteAction = deleteProjectAction.bind(null, project.id);
  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";

  return (
    <AppShell>
      <AdminPageSurface>
        <ProjectResearchHub
          project={project}
          relatedAssets={relatedAssets}
          deleteAction={deleteAction}
          error={error}
          notice={notice}
        />
      </AdminPageSurface>
    </AppShell>
  );
}
