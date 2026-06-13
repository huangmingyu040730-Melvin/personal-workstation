import Link from "next/link";
import { Network } from "lucide-react";
import { AdminSecurityNote } from "@/components/admin-ui";
import { Card, CardHeader } from "@/components/card";
import type { ResearchAssetType } from "@/lib/content-types";
import type { AssetLinksForAsset, AssetLinkTargetOptions } from "@/lib/queries/asset-links";
import { AssetLinksList } from "./asset-links-list";
import { CreateAssetLinkForm } from "./create-asset-link-form";

type AssetLinksPanelProps = {
  assetType: ResearchAssetType;
  assetId: string;
  links: AssetLinksForAsset;
  targetOptions: AssetLinkTargetOptions;
  returnTo: string;
};

export function AssetLinksPanel({
  assetType,
  assetId,
  links,
  targetOptions,
  returnTo
}: AssetLinksPanelProps) {
  return (
    <Card>
      <CardHeader
        title="显式关联资产"
        description="用于记录 Project、Knowledge、Skill、Publication 之间的人工确认关系；Documents 仍通过文件面板管理。"
        action={
          <Link href="/dashboard/network" className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Network size={15} />
            查看关系图谱
          </Link>
        }
      />

      <div className="space-y-5">
        <CreateAssetLinkForm
          sourceType={assetType}
          sourceId={assetId}
          targetOptions={targetOptions}
          returnTo={returnTo}
        />

        <AdminSecurityNote>
          这些关系只在管理员后台使用，不改变公开展示、内容权限或 Documents 附件访问边界。
        </AdminSecurityNote>

        <AssetLinksList links={links} returnTo={returnTo} />
      </div>
    </Card>
  );
}
