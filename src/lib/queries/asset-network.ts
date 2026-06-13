import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/auth/admin";
import {
  getPublicationTypeLabel,
  getResearchAssetRelationTypeLabel
} from "@/lib/content-options";
import type { ResearchAssetLinkRecord, ResearchAssetRelationType, ResearchAssetType } from "@/lib/content-types";
import { statusLabel, visibilityLabel } from "@/lib/utils";
import { buildAssetDashboardHref } from "./asset-links";

export const ASSET_NETWORK_LINK_LIMIT = 200;
export const ASSET_NETWORK_ERROR_MESSAGE = "关系图谱数据读取失败，请确认 0019 migration 已执行。";

export type AssetNetworkNode = {
  id: string;
  assetType: ResearchAssetType;
  assetId: string;
  title: string;
  href: string;
  metadata: string | null;
  updatedAt: string | null;
};

export type AssetNetworkEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceType: ResearchAssetType;
  sourceId: string;
  targetType: ResearchAssetType;
  targetId: string;
  relationType: ResearchAssetRelationType;
  relationLabel: string;
  note: string | null;
  updatedAt: string;
};

export type AssetNetworkGraph = {
  nodes: AssetNetworkNode[];
  edges: AssetNetworkEdge[];
};

export type AssetNetworkGraphResult = {
  graph: AssetNetworkGraph;
  error: string | null;
};

type AssetNetworkRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  status?: string | null;
  category?: string | null;
  publication_type?: string | null;
  visibility?: "public" | "private" | "unlisted" | "restricted" | null;
  updated_at?: string | null;
};

type AssetIdsByType = Record<ResearchAssetType, string[]>;

function createEmptyGraph(): AssetNetworkGraph {
  return {
    nodes: [],
    edges: []
  };
}

function createEmptyAssetIdsByType(): AssetIdsByType {
  return {
    project: [],
    knowledge: [],
    skill: [],
    publication: []
  };
}

function buildNodeId(type: ResearchAssetType, id: string) {
  return `${type}:${id}`;
}

function assetNodeFromRow(type: ResearchAssetType, row: AssetNetworkRow): AssetNetworkNode {
  const title = row.title ?? row.name ?? "未命名资产";
  const metadataParts = [
    type === "project" && row.status ? statusLabel(row.status) : null,
    type === "skill" && row.status ? statusLabel(row.status) : null,
    type === "knowledge" ? row.category : null,
    type === "publication" ? getPublicationTypeLabel(row.publication_type) : null,
    row.visibility ? visibilityLabel(row.visibility) : null
  ].filter(Boolean);

  return {
    id: buildNodeId(type, row.id),
    assetType: type,
    assetId: row.id,
    title,
    href: buildAssetDashboardHref(type, row.id),
    metadata: metadataParts.length > 0 ? metadataParts.join(" · ") : null,
    updatedAt: row.updated_at ?? null
  };
}

function missingAssetNode(type: ResearchAssetType, id: string): AssetNetworkNode {
  return {
    id: buildNodeId(type, id),
    assetType: type,
    assetId: id,
    title: "已删除或无法读取的资产",
    href: buildAssetDashboardHref(type, id),
    metadata: null,
    updatedAt: null
  };
}

function collectAssetIds(links: ResearchAssetLinkRecord[]) {
  const idsByType = createEmptyAssetIdsByType();

  for (const link of links) {
    idsByType[link.source_type].push(link.source_id);
    idsByType[link.target_type].push(link.target_id);
  }

  return {
    project: Array.from(new Set(idsByType.project)),
    knowledge: Array.from(new Set(idsByType.knowledge)),
    skill: Array.from(new Set(idsByType.skill)),
    publication: Array.from(new Set(idsByType.publication))
  };
}

async function resolveNetworkNodes(supabase: SupabaseClient, links: ResearchAssetLinkRecord[]) {
  const idsByType = collectAssetIds(links);
  const nodes = new Map<string, AssetNetworkNode>();
  const queries = [];

  if (idsByType.project.length > 0) {
    queries.push(
      supabase
        .from("projects")
        .select("id,title,status,visibility,updated_at")
        .in("id", idsByType.project)
        .then((result) => ({ type: "project" as const, result }))
    );
  }

  if (idsByType.knowledge.length > 0) {
    queries.push(
      supabase
        .from("knowledge_notes")
        .select("id,title,category,visibility,updated_at")
        .in("id", idsByType.knowledge)
        .then((result) => ({ type: "knowledge" as const, result }))
    );
  }

  if (idsByType.skill.length > 0) {
    queries.push(
      supabase
        .from("skills")
        .select("id,name,category,status,visibility,updated_at")
        .in("id", idsByType.skill)
        .then((result) => ({ type: "skill" as const, result }))
    );
  }

  if (idsByType.publication.length > 0) {
    queries.push(
      supabase
        .from("publications")
        .select("id,title,publication_type,visibility,updated_at")
        .in("id", idsByType.publication)
        .then((result) => ({ type: "publication" as const, result }))
    );
  }

  const results = await Promise.all(queries);

  for (const { type, result } of results) {
    if (result.error) {
      console.error("resolveNetworkNodes failed", {
        type,
        code: result.error.code,
        message: result.error.message
      });
      continue;
    }

    for (const row of (result.data ?? []) as AssetNetworkRow[]) {
      const node = assetNodeFromRow(type, row);
      nodes.set(node.id, node);
    }
  }

  for (const link of links) {
    const sourceNodeId = buildNodeId(link.source_type, link.source_id);
    const targetNodeId = buildNodeId(link.target_type, link.target_id);

    if (!nodes.has(sourceNodeId)) {
      nodes.set(sourceNodeId, missingAssetNode(link.source_type, link.source_id));
    }

    if (!nodes.has(targetNodeId)) {
      nodes.set(targetNodeId, missingAssetNode(link.target_type, link.target_id));
    }
  }

  return nodes;
}

function edgeFromLink(link: ResearchAssetLinkRecord): AssetNetworkEdge {
  return {
    id: link.id,
    sourceNodeId: buildNodeId(link.source_type, link.source_id),
    targetNodeId: buildNodeId(link.target_type, link.target_id),
    sourceType: link.source_type,
    sourceId: link.source_id,
    targetType: link.target_type,
    targetId: link.target_id,
    relationType: link.relation_type,
    relationLabel: getResearchAssetRelationTypeLabel(link.relation_type),
    note: link.note,
    updatedAt: link.updated_at
  };
}

export async function getAssetNetworkGraph(): Promise<AssetNetworkGraphResult> {
  const { supabase, isAdmin } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return {
      graph: createEmptyGraph(),
      error: null
    };
  }

  const { data, error } = await supabase
    .from("research_asset_links")
    .select("id,source_type,source_id,target_type,target_id,relation_type,note,created_by,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(ASSET_NETWORK_LINK_LIMIT);

  if (error) {
    console.error("getAssetNetworkGraph failed", {
      code: error.code,
      message: error.message
    });

    return {
      graph: createEmptyGraph(),
      error: ASSET_NETWORK_ERROR_MESSAGE
    };
  }

  const links = (data ?? []) as ResearchAssetLinkRecord[];
  const nodeMap = await resolveNetworkNodes(supabase, links);

  return {
    graph: {
      nodes: Array.from(nodeMap.values()).sort((a, b) => a.title.localeCompare(b.title, "zh-CN")),
      edges: links.map(edgeFromLink)
    },
    error: null
  };
}
