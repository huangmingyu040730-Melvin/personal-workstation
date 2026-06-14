import type { ResearchAssetLinkRecord, ResearchAssetType } from "@/lib/content-types";
import { getPublicationTypeLabel } from "@/lib/content-options";
import { createClient } from "@/lib/supabase/server";
import { statusLabel, visibilityLabel } from "@/lib/utils";
import { getKnowledgeNoteOptions } from "./knowledge";
import { getProjectOptions } from "./projects";
import { getPublicationOptions } from "./publications";
import { getSkillOptions } from "./skills";

export type AssetSummary = {
  id: string;
  type: ResearchAssetType;
  title: string;
  href: string;
  metadata: string | null;
  updated_at: string | null;
};

export type AssetLinkTargetOption = AssetSummary;

export type AssetLinkTargetOptions = Record<ResearchAssetType, AssetLinkTargetOption[]>;

export type ResolvedAssetLink = ResearchAssetLinkRecord & {
  direction: "outbound" | "inbound";
  other: AssetSummary;
};

export type AssetLinksForAsset = {
  outbound: ResolvedAssetLink[];
  inbound: ResolvedAssetLink[];
};

type AssetOptionRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  status?: string | null;
  category?: string | null;
  publication_type?: string | null;
  visibility?: "public" | "private" | "unlisted" | null;
  updated_at?: string | null;
};

function cloneEmptyTargetOptions(): AssetLinkTargetOptions {
  return {
    project: [],
    knowledge: [],
    skill: [],
    publication: []
  };
}

export function buildAssetDashboardHref(type: ResearchAssetType, id: string) {
  const path = type === "project"
    ? "projects"
    : type === "knowledge"
      ? "knowledge"
      : type === "skill"
        ? "skills"
        : "publications";

  return `/dashboard/${path}/${id}`;
}

function missingAssetSummary(type: ResearchAssetType, id: string): AssetSummary {
  return {
    id,
    type,
    title: "已删除或无法读取的资产",
    href: buildAssetDashboardHref(type, id),
    metadata: null,
    updated_at: null
  };
}

function optionFromRow(type: ResearchAssetType, row: AssetOptionRow): AssetSummary {
  const title = row.title ?? row.name ?? "未命名资产";
  const metadataParts = [
    type === "project" && row.status ? statusLabel(row.status) : null,
    type === "skill" && row.status ? statusLabel(row.status) : null,
    type === "knowledge" ? row.category : null,
    type === "publication" ? getPublicationTypeLabel(row.publication_type) : null,
    row.visibility ? visibilityLabel(row.visibility) : null
  ].filter(Boolean);

  return {
    id: row.id,
    type,
    title,
    href: buildAssetDashboardHref(type, row.id),
    metadata: metadataParts.length > 0 ? metadataParts.join(" · ") : null,
    updated_at: row.updated_at ?? null
  };
}

async function getFallbackTargetOptions(): Promise<AssetLinkTargetOptions> {
  const [projects, knowledge, skills, publications] = await Promise.all([
    getProjectOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions(),
    getPublicationOptions()
  ]);

  return {
    project: projects.map((item) => ({
      id: item.id,
      type: "project",
      title: item.title,
      href: buildAssetDashboardHref("project", item.id),
      metadata: null,
      updated_at: null
    })),
    knowledge: knowledge.map((item) => ({
      id: item.id,
      type: "knowledge",
      title: item.title,
      href: buildAssetDashboardHref("knowledge", item.id),
      metadata: null,
      updated_at: null
    })),
    skill: skills.map((item) => ({
      id: item.id,
      type: "skill",
      title: item.title,
      href: buildAssetDashboardHref("skill", item.id),
      metadata: null,
      updated_at: null
    })),
    publication: publications.map((item) => ({
      id: item.id,
      type: "publication",
      title: item.title,
      href: buildAssetDashboardHref("publication", item.id),
      metadata: null,
      updated_at: null
    }))
  };
}

export async function getAssetLinkTargetOptions(limit = 100): Promise<AssetLinkTargetOptions> {
  const supabase = await createClient();

  if (!supabase) {
    return getFallbackTargetOptions();
  }

  const [projectResult, knowledgeResult, skillResult, publicationResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,status,visibility,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("knowledge_notes")
      .select("id,title,category,visibility,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("skills")
      .select("id,name,category,status,visibility,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("publications")
      .select("id,title,publication_type,visibility,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit)
  ]);

  if (projectResult.error || knowledgeResult.error || skillResult.error || publicationResult.error) {
    console.error("getAssetLinkTargetOptions failed", {
      projects: projectResult.error ? { code: projectResult.error.code, message: projectResult.error.message } : null,
      knowledge: knowledgeResult.error ? { code: knowledgeResult.error.code, message: knowledgeResult.error.message } : null,
      skills: skillResult.error ? { code: skillResult.error.code, message: skillResult.error.message } : null,
      publications: publicationResult.error ? { code: publicationResult.error.code, message: publicationResult.error.message } : null
    });
  }

  return {
    project: ((projectResult.data ?? []) as AssetOptionRow[]).map((row) => optionFromRow("project", row)),
    knowledge: ((knowledgeResult.data ?? []) as AssetOptionRow[]).map((row) => optionFromRow("knowledge", row)),
    skill: ((skillResult.data ?? []) as AssetOptionRow[]).map((row) => optionFromRow("skill", row)),
    publication: ((publicationResult.data ?? []) as AssetOptionRow[]).map((row) => optionFromRow("publication", row))
  };
}

function collectOtherAssetIds(links: ResearchAssetLinkRecord[], assetType: ResearchAssetType) {
  const idsByType = cloneEmptyTargetOptions();

  for (const link of links) {
    const otherType = link.source_type === assetType ? link.target_type : link.source_type;
    const otherId = link.source_type === assetType ? link.target_id : link.source_id;

    idsByType[otherType].push(missingAssetSummary(otherType, otherId));
  }

  return {
    project: Array.from(new Set(idsByType.project.map((item) => item.id))),
    knowledge: Array.from(new Set(idsByType.knowledge.map((item) => item.id))),
    skill: Array.from(new Set(idsByType.skill.map((item) => item.id))),
    publication: Array.from(new Set(idsByType.publication.map((item) => item.id)))
  };
}

async function resolveAssetSummaries(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  links: ResearchAssetLinkRecord[],
  assetType: ResearchAssetType
) {
  const idsByType = collectOtherAssetIds(links, assetType);
  const summaries = new Map<string, AssetSummary>();
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
      console.error("resolveAssetSummaries failed", {
        type,
        code: result.error.code,
        message: result.error.message
      });
      continue;
    }

    for (const row of (result.data ?? []) as AssetOptionRow[]) {
      summaries.set(`${type}:${row.id}`, optionFromRow(type, row));
    }
  }

  return summaries;
}

function resolveLink(
  link: ResearchAssetLinkRecord,
  direction: "outbound" | "inbound",
  summaries: Map<string, AssetSummary>
): ResolvedAssetLink {
  const otherType = direction === "outbound" ? link.target_type : link.source_type;
  const otherId = direction === "outbound" ? link.target_id : link.source_id;

  return {
    ...link,
    direction,
    other: summaries.get(`${otherType}:${otherId}`) ?? missingAssetSummary(otherType, otherId)
  };
}

export async function getAssetLinksForAsset(
  assetType: ResearchAssetType,
  assetId: string
): Promise<AssetLinksForAsset> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      outbound: [],
      inbound: []
    };
  }

  const [outboundResult, inboundResult] = await Promise.all([
    supabase
      .from("research_asset_links")
      .select("*")
      .eq("source_type", assetType)
      .eq("source_id", assetId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("research_asset_links")
      .select("*")
      .eq("target_type", assetType)
      .eq("target_id", assetId)
      .order("updated_at", { ascending: false })
  ]);

  if (outboundResult.error || inboundResult.error) {
    console.error("getAssetLinksForAsset failed", {
      assetType,
      assetId,
      outbound: outboundResult.error ? { code: outboundResult.error.code, message: outboundResult.error.message } : null,
      inbound: inboundResult.error ? { code: inboundResult.error.code, message: inboundResult.error.message } : null
    });

    return {
      outbound: [],
      inbound: []
    };
  }

  const outbound = (outboundResult.data ?? []) as ResearchAssetLinkRecord[];
  const inbound = (inboundResult.data ?? []) as ResearchAssetLinkRecord[];
  const summaries = await resolveAssetSummaries(supabase, [...outbound, ...inbound], assetType);

  return {
    outbound: outbound.map((link) => resolveLink(link, "outbound", summaries)),
    inbound: inbound.map((link) => resolveLink(link, "inbound", summaries))
  };
}
