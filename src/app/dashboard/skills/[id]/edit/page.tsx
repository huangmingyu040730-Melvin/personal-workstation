import { notFound } from "next/navigation";
import { updateSkillAction } from "@/actions/skills";
import { AppShell } from "@/components/app-shell";
import { AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { SkillForm } from "@/components/forms/skill-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getSkillById } from "@/lib/queries/skills";

export default async function EditSkillPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const skill = await getSkillById(id);

  if (!skill) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Skills Library" title="编辑 Skill" description="保存后会刷新 Skill 详情、Dashboard 与公开首页数据。" />
        <AdminFormSurface>
          <SkillForm action={updateSkillAction.bind(null, skill.id)} skill={skill} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
