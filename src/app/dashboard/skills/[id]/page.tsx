import { notFound } from "next/navigation";
import { createSkillVersionAction, deleteSkillAction } from "@/actions/skills";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface } from "@/components/admin-ui";
import { SkillCapabilityHub } from "@/components/skills/skill-capability-hub";
import { getFormError } from "@/lib/forms";
import { getAssetLinksForAsset, getAssetLinkTargetOptions } from "@/lib/queries/asset-links";
import { getSkillById, getSkillVersions } from "@/lib/queries/skills";

export default async function SkillDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [skill, versions] = await Promise.all([getSkillById(id), getSkillVersions(id)]);

  if (!skill) {
    notFound();
  }

  const [assetLinks, assetLinkOptions] = await Promise.all([
    getAssetLinksForAsset("skill", skill.id),
    getAssetLinkTargetOptions()
  ]);
  const error = getFormError(query);
  const notice = query.notice === "collection_deleted";

  return (
    <AppShell>
      <AdminPageSurface>
        <SkillCapabilityHub
          skill={skill}
          versions={versions}
          assetLinks={assetLinks}
          assetLinkOptions={assetLinkOptions}
          deleteAction={deleteSkillAction.bind(null, skill.id)}
          createVersionAction={createSkillVersionAction.bind(null, skill.id)}
          error={error}
          notice={notice}
        />
      </AdminPageSurface>
    </AppShell>
  );
}
