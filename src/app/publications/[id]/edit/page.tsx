import { notFound } from "next/navigation";
import { updatePublicationAction } from "@/actions/publications";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { PublicationForm } from "@/components/forms/publication-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getPublicationById } from "@/lib/queries/publications";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function EditPublicationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query, projects] = await Promise.all([params, searchParams, getProjectOptions()]);
  const publication = await getPublicationById(id);

  if (!publication) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Publications" title="编辑学术成果" description="保存后会刷新成果详情、Dashboard 与公开首页数据。" />
      <Card>
        <PublicationForm action={updatePublicationAction.bind(null, publication.id)} publication={publication} projects={projects} error={getFormError(query)} />
      </Card>
    </AppShell>
  );
}
