import Link from "next/link";
import { Network, ShieldCheck } from "lucide-react";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { AssetNetworkView } from "@/components/asset-network/asset-network-view";
import { PageHeader } from "@/components/page-header";
import { ASSET_NETWORK_LINK_LIMIT, getAssetNetworkGraph } from "@/lib/queries/asset-network";

export default async function DashboardNetworkPage() {
  const { graph, error } = await getAssetNetworkGraph();

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Research Network"
          title="研究资产关系图谱"
          description="以动态网络形式查看 Project、Knowledge、Skill、Publication 之间的显式关系。拖动节点、缩放画布，并聚焦单个资产理解局部网络。"
          action={
            <Link href="/dashboard/search" className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
              <Network size={16} />
              搜索研究资产
            </Link>
          }
        />

        <AssetNetworkView graph={graph} linkLimit={ASSET_NETWORK_LINK_LIMIT} />

        {error ? (
          <div className="flex gap-3 rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            <ShieldCheck className="mt-0.5 shrink-0" size={18} />
            <p>{error}</p>
          </div>
        ) : null}

        <AdminSecurityNote>
          关系图谱只读取 `research_asset_links` 和四类研究资产 metadata，不读取 Documents、文件正文或 Supabase Storage，不生成 signed URL，也不改变公开展示和权限边界。
        </AdminSecurityNote>
      </AdminPageSurface>
    </AppShell>
  );
}
