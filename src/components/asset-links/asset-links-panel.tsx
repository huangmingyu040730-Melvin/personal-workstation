import { AdminEmptyState, AdminSecurityNote } from "@/components/admin-ui";
import { Card, CardHeader } from "@/components/card";
import type { ResearchAssetType } from "@/lib/content-types";
import type { AssetLinksForAsset, AssetLinkTargetOptions } from "@/lib/queries/asset-links";
import { AssetLinkCard } from "./asset-link-card";
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
  const hasLinks = links.outbound.length > 0 || links.inbound.length > 0;

  return (
    <Card>
      <CardHeader
        title="显式关联资产"
        description="用于记录 Project、Knowledge、Skill、Publication 之间的人工确认关系；Documents 仍通过文件面板管理。"
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

        {!hasLinks ? (
          <AdminEmptyState
            title="还没有显式关联资产"
            description="可以新增一条关系，表达当前资产支持、引用、使用、产出或来源于另一个研究资产。"
          />
        ) : null}

        {links.outbound.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">当前资产关联出去</h3>
              <span className="text-xs font-medium text-slate-400">{links.outbound.length}</span>
            </div>
            <div className="space-y-3">
              {links.outbound.map((link) => (
                <AssetLinkCard key={link.id} link={link} returnTo={returnTo} />
              ))}
            </div>
          </section>
        ) : null}

        {links.inbound.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">反向关系 / Backlinks</h3>
              <span className="text-xs font-medium text-slate-400">{links.inbound.length}</span>
            </div>
            <div className="space-y-3">
              {links.inbound.map((link) => (
                <AssetLinkCard key={link.id} link={link} returnTo={returnTo} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Card>
  );
}
