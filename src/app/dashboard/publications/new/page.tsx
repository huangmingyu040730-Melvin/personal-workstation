import { createPublicationAction } from "@/actions/publications";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { PublicationForm } from "@/components/forms/publication-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getProjectOptions } from "@/lib/queries/projects";

export default async function NewPublicationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, projects] = await Promise.all([searchParams, getProjectOptions()]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Publications" title="新建学术成果" description="创建真实成果记录，保存后会写入 Supabase publications 表。" />
        <AdminFormSurface>
          <PublicationForm action={createPublicationAction} projects={projects} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
