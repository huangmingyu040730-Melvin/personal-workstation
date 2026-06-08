import { createSkillAction } from "@/actions/skills";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { SkillForm } from "@/components/forms/skill-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";

export default async function NewSkillPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Skills Library" title="新建 Skill" description="创建真实 Skill 记录，可同时生成第一条版本记录。" />
        <AdminFormSurface>
          <SkillForm action={createSkillAction} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
