import { notFound } from "next/navigation";
import { updateSkillAction } from "@/actions/skills";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
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
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="编辑 Skill"
                description="保存后会刷新 Skill 详情、Dashboard 与公开首页数据。"
                items={["版本号建议和实际能力变化对应。", "使用指南应保留人工复核边界。", "仓库链接可选，不要填写私密地址。"]}
              />
              <AdminFormHelpCard
                title="公开展示"
                tone="emerald"
                items={["public + featured 会进入公开首页。", "private Skill 仅管理员后台可见。", "SKILL.md 内容建议保持可复制执行。"]}
              />
            </>
          }
        >
          <SkillForm action={updateSkillAction.bind(null, skill.id)} skill={skill} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
