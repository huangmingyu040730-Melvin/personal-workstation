import type { SupabaseClient } from "@supabase/supabase-js";
import { getDocumentAssetRelationTypeLabel } from "@/lib/content-options";
import type { DocumentAssetLinkSummary, DocumentAssetRelationType, DocumentRelatedType } from "@/lib/content-types";

export type DocumentAssetLinkInput = {
  asset_type: DocumentRelatedType;
  asset_id: string;
  relation_type: DocumentAssetRelationType;
  note: string | null;
};

export type DocumentAssetLinkRow = DocumentAssetLinkInput & {
  id: string;
};

type DocumentOwnedLinkRow = DocumentAssetLinkRow & {
  document_id: string;
};

type CollectionOwnedLinkRow = DocumentAssetLinkRow & {
  collection_id: string;
};

type LegacyRelatedRecord = {
  id: string;
  related_type: DocumentRelatedType | null;
  related_id: string | null;
};

type AssetReference = {
  asset_type: DocumentRelatedType;
  asset_id: string;
};

type AssetResolver = (reference: AssetReference) => { title: string; href: string } | null;

function uniqueReferences(references: AssetReference[]) {
  const seen = new Set<string>();

  return references.filter((reference) => {
    const key = `${reference.asset_type}:${reference.asset_id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getLegacyRelationSummaryId(record: LegacyRelatedRecord) {
  return `legacy:${record.id}:${record.related_type}:${record.related_id}`;
}

function getAssetRelationKey(relation: Pick<DocumentAssetLinkSummary, "asset_type" | "asset_id">) {
  return `${relation.asset_type}:${relation.asset_id}`;
}

function hasRelationForAsset(relations: DocumentAssetLinkSummary[], relation: Pick<DocumentAssetLinkSummary, "asset_type" | "asset_id">) {
  return relations.some((item) => (
    item.asset_type === relation.asset_type &&
    item.asset_id === relation.asset_id
  ));
}

export function normalizeDocumentAssetRelations(relations: DocumentAssetLinkSummary[]) {
  const assetsWithSpecificRelations = new Set(
    relations
      .filter((relation) => relation.relation_type !== "related")
      .map((relation) => getAssetRelationKey(relation))
  );

  return relations.filter((relation) => (
    relation.relation_type !== "related" ||
    !assetsWithSpecificRelations.has(getAssetRelationKey(relation))
  ));
}

function normalizeRelationsByOwnerId(relationsByOwnerId: Map<string, DocumentAssetLinkSummary[]>) {
  relationsByOwnerId.forEach((relations, ownerId) => {
    relationsByOwnerId.set(ownerId, normalizeDocumentAssetRelations(relations));
  });
}

export function getDocumentAssetDetailHref(assetType: DocumentRelatedType, assetId: string) {
  if (assetType === "publication") {
    return `/dashboard/publications/${assetId}`;
  }

  if (assetType === "project") {
    return `/dashboard/projects/${assetId}`;
  }

  if (assetType === "knowledge") {
    return `/dashboard/knowledge/${assetId}`;
  }

  return `/dashboard/skills/${assetId}`;
}

export function getDocumentAssetLinkKey(link: Pick<DocumentAssetLinkInput, "asset_type" | "asset_id" | "relation_type">) {
  return `${link.asset_type}:${link.asset_id}:${link.relation_type}`;
}

export async function getDocumentAssetResolver(supabase: SupabaseClient, references: AssetReference[]): Promise<AssetResolver> {
  const refs = uniqueReferences(references);
  const idsByType = refs.reduce<Record<DocumentRelatedType, string[]>>((acc, reference) => {
    acc[reference.asset_type].push(reference.asset_id);
    return acc;
  }, { publication: [], project: [], knowledge: [], skill: [] });

  const [publicationsResult, projectsResult, knowledgeResult, skillsResult] = await Promise.all([
    idsByType.publication.length > 0
      ? supabase.from("publications").select("id,title").in("id", idsByType.publication)
      : Promise.resolve({ data: [], error: null }),
    idsByType.project.length > 0
      ? supabase.from("projects").select("id,title").in("id", idsByType.project)
      : Promise.resolve({ data: [], error: null }),
    idsByType.knowledge.length > 0
      ? supabase.from("knowledge_notes").select("id,title").in("id", idsByType.knowledge)
      : Promise.resolve({ data: [], error: null }),
    idsByType.skill.length > 0
      ? supabase.from("skills").select("id,name").in("id", idsByType.skill)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (publicationsResult.error || projectsResult.error || knowledgeResult.error || skillsResult.error) {
    console.error("getDocumentAssetResolver failed", {
      publications: publicationsResult.error?.message,
      projects: projectsResult.error?.message,
      knowledge: knowledgeResult.error?.message,
      skills: skillsResult.error?.message
    });
  }

  const publicationMap = new Map((publicationsResult.data ?? []).map((item) => [item.id, item.title]));
  const projectMap = new Map((projectsResult.data ?? []).map((item) => [item.id, item.title]));
  const knowledgeMap = new Map((knowledgeResult.data ?? []).map((item) => [item.id, item.title]));
  const skillMap = new Map((skillsResult.data ?? []).map((item) => [item.id, item.name]));

  return (reference) => {
    const title = reference.asset_type === "publication"
      ? publicationMap.get(reference.asset_id)
      : reference.asset_type === "project"
        ? projectMap.get(reference.asset_id)
        : reference.asset_type === "knowledge"
          ? knowledgeMap.get(reference.asset_id)
          : skillMap.get(reference.asset_id);

    return title
      ? {
          title,
          href: getDocumentAssetDetailHref(reference.asset_type, reference.asset_id)
        }
      : null;
  };
}

export async function resolveDocumentAssetLinkRows(
  supabase: SupabaseClient,
  rows: DocumentAssetLinkRow[]
): Promise<DocumentAssetLinkSummary[]> {
  if (rows.length === 0) {
    return [];
  }

  const resolveAsset = await getDocumentAssetResolver(supabase, rows);

  return rows.flatMap((row) => {
    const asset = resolveAsset(row);

    if (!asset) {
      return [];
    }

    return [{
      id: row.id,
      asset_type: row.asset_type,
      asset_id: row.asset_id,
      relation_type: row.relation_type,
      relation_label: getDocumentAssetRelationTypeLabel(row.relation_type),
      title: asset.title,
      href: asset.href,
      note: row.note
    }];
  });
}

function appendLegacyRelations(
  records: LegacyRelatedRecord[],
  relationsByOwnerId: Map<string, DocumentAssetLinkSummary[]>,
  resolveAsset: AssetResolver
) {
  for (const record of records) {
    if (!record.related_type || !record.related_id) {
      continue;
    }

    const asset = resolveAsset({
      asset_type: record.related_type,
      asset_id: record.related_id
    });

    if (!asset) {
      continue;
    }

    const current = relationsByOwnerId.get(record.id) ?? [];
    const legacyRelation: DocumentAssetLinkSummary = {
      id: getLegacyRelationSummaryId(record),
      asset_type: record.related_type,
      asset_id: record.related_id,
      relation_type: "related",
      relation_label: getDocumentAssetRelationTypeLabel("related"),
      title: asset.title,
      href: asset.href,
      note: null
    };

    if (!hasRelationForAsset(current, legacyRelation)) {
      relationsByOwnerId.set(record.id, [...current, legacyRelation]);
    }
  }
}

export async function getDocumentRelationsMap(
  supabase: SupabaseClient,
  documents: LegacyRelatedRecord[]
): Promise<Map<string, DocumentAssetLinkSummary[]>> {
  const relationsByDocumentId = new Map<string, DocumentAssetLinkSummary[]>();
  const documentIds = documents.map((document) => document.id);

  if (documentIds.length === 0) {
    return relationsByDocumentId;
  }

  const { data, error } = await supabase
    .from("document_asset_links")
    .select("id,document_id,asset_type,asset_id,relation_type,note")
    .in("document_id", documentIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getDocumentRelationsMap failed", { code: error.code, message: error.message });
  }

  const linkRows = (data ?? []) as DocumentOwnedLinkRow[];
  const resolved = await resolveDocumentAssetLinkRows(supabase, linkRows);

  for (const row of linkRows) {
    const summary = resolved.find((item) => item.id === row.id);

    if (!summary) {
      continue;
    }

    const current = relationsByDocumentId.get(row.document_id) ?? [];
    relationsByDocumentId.set(row.document_id, [...current, summary]);
  }

  const resolveLegacyAsset = await getDocumentAssetResolver(
    supabase,
    documents
      .filter((document): document is LegacyRelatedRecord & { related_type: DocumentRelatedType; related_id: string } => Boolean(document.related_type && document.related_id))
      .map((document) => ({
        asset_type: document.related_type,
        asset_id: document.related_id
      }))
  );
  appendLegacyRelations(documents, relationsByDocumentId, resolveLegacyAsset);
  normalizeRelationsByOwnerId(relationsByDocumentId);

  return relationsByDocumentId;
}

export async function getDocumentCollectionRelationsMap(
  supabase: SupabaseClient,
  collections: LegacyRelatedRecord[]
): Promise<Map<string, DocumentAssetLinkSummary[]>> {
  const relationsByCollectionId = new Map<string, DocumentAssetLinkSummary[]>();
  const collectionIds = collections.map((collection) => collection.id);

  if (collectionIds.length === 0) {
    return relationsByCollectionId;
  }

  const { data, error } = await supabase
    .from("document_collection_asset_links")
    .select("id,collection_id,asset_type,asset_id,relation_type,note")
    .in("collection_id", collectionIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getDocumentCollectionRelationsMap failed", { code: error.code, message: error.message });
  }

  const linkRows = (data ?? []) as CollectionOwnedLinkRow[];
  const resolved = await resolveDocumentAssetLinkRows(supabase, linkRows);

  for (const row of linkRows) {
    const summary = resolved.find((item) => item.id === row.id);

    if (!summary) {
      continue;
    }

    const current = relationsByCollectionId.get(row.collection_id) ?? [];
    relationsByCollectionId.set(row.collection_id, [...current, summary]);
  }

  const resolveLegacyAsset = await getDocumentAssetResolver(
    supabase,
    collections
      .filter((collection): collection is LegacyRelatedRecord & { related_type: DocumentRelatedType; related_id: string } => Boolean(collection.related_type && collection.related_id))
      .map((collection) => ({
        asset_type: collection.related_type,
        asset_id: collection.related_id
      }))
  );
  appendLegacyRelations(collections, relationsByCollectionId, resolveLegacyAsset);
  normalizeRelationsByOwnerId(relationsByCollectionId);

  return relationsByCollectionId;
}

export async function getDocumentIdsByAssetLink(
  supabase: SupabaseClient,
  assetType: DocumentRelatedType,
  assetId: string
) {
  const { data, error } = await supabase
    .from("document_asset_links")
    .select("document_id")
    .eq("asset_type", assetType)
    .eq("asset_id", assetId);

  if (error) {
    console.error("getDocumentIdsByAssetLink failed", { code: error.code, message: error.message });
    return [];
  }

  return Array.from(new Set((data ?? []).map((row) => row.document_id as string)));
}

export async function getDocumentCollectionIdsByAssetLink(
  supabase: SupabaseClient,
  assetType: DocumentRelatedType,
  assetId: string
) {
  const { data, error } = await supabase
    .from("document_collection_asset_links")
    .select("collection_id")
    .eq("asset_type", assetType)
    .eq("asset_id", assetId);

  if (error) {
    console.error("getDocumentCollectionIdsByAssetLink failed", { code: error.code, message: error.message });
    return [];
  }

  return Array.from(new Set((data ?? []).map((row) => row.collection_id as string)));
}
