import { createProjectAction } from "@/actions/projects";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/card";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return (
    <AppShell>
      <PageHeader eyebrow="Projects" title="新建研究项目" description="创建真实项目记录，保存后会写入 Supabase projects 表。" />
      <Card>
        <ProjectForm action={createProjectAction} error={getFormError(params)} />
      </Card>
    </AppShell>
  );
}
