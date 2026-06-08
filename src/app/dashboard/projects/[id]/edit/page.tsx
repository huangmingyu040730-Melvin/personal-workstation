import { notFound } from "next/navigation";
import { updateProjectAction } from "@/actions/projects";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getProjectById } from "@/lib/queries/projects";

export default async function EditProjectPage({
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

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Projects" title="编辑研究项目" description="保存后会刷新项目详情、Dashboard 与公开首页数据。" />
        <AdminFormSurface>
          <ProjectForm action={updateProjectAction.bind(null, project.id)} project={project} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
