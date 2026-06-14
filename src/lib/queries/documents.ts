import type { DocumentCollectionRecord, DocumentCollectionWithRelation, DocumentRecord, DocumentRelatedType, DocumentWithRelation } from "@/lib/content-types";
import { documents as mockDocuments } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { getDocumentCollectionRelationsMap, getDocumentRelationsMap } from "./document-asset-links";

function mockDocumentFallback(): DocumentWithRelation[] {
  return mockDocuments.map((document) => ({
    id: document.id,
    name: document.name,
    category: "research_material",
    storage_bucket: "workspace-files",
    storage_path: `mock/${document.id}`,
    file_size: document.size.includes("MB") ? 2_400_000 : 128_000,
    mime_type: "application/pdf",
    collection_id: null,
    original_name: document.name,
    relative_path: null,
    folder_path: null,
    related_type: null,
    related_id: null,
    visibility: "private",
    owner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related: null,
    relations: []
  }));
}

type RelatedRecord = {
  related_type: DocumentRelatedType | null;
  related_id: string | null;
};

async function getRelatedResolver(records: RelatedRecord[]) {
  const supabase = await createClient();

  if (!supabase || records.length === 0) {
    return () => null;
  }

  const idsByType = records.reduce<Record<DocumentRelatedType, string[]>>((acc, record) => {
    if (record.related_type && record.related_id) {
      acc[record.related_type].push(record.related_id);
    }
    return acc;
  }, { publication: [], project: [], knowledge: [], skill: [] });

  const [publicationsResult, projectsResult, knowledgeResult, skillsResult] = await Promise.all([
    idsByType.publication.length > 0
      ? supabase.from("publications").select("id,title").in("id", Array.from(new Set(idsByType.publication)))
      : Promise.resolve({ data: [], error: null }),
    idsByType.project.length > 0
      ? supabase.from("projects").select("id,title").in("id", Array.from(new Set(idsByType.project)))
      : Promise.resolve({ data: [], error: null }),
    idsByType.knowledge.length > 0
      ? supabase.from("knowledge_notes").select("id,title").in("id", Array.from(new Set(idsByType.knowledge)))
      : Promise.resolve({ data: [], error: null }),
    idsByType.skill.length > 0
      ? supabase.from("skills").select("id,name").in("id", Array.from(new Set(idsByType.skill)))
      : Promise.resolve({ data: [], error: null })
  ]);

  if (publicationsResult.error || projectsResult.error || knowledgeResult.error || skillsResult.error) {
    console.error("resolveDocumentRelations failed", {
      publications: publicationsResult.error?.message,
      projects: projectsResult.error?.message,
      knowledge: knowledgeResult.error?.message,
      skills: skillsResult.error?.message
    });
  }

  const publicationMap = new Map((publicationsResult.data ?? []).map((item) => [item.id, { title: item.title, href: `/dashboard/publications/${item.id}` }]));
  const projectMap = new Map((projectsResult.data ?? []).map((item) => [item.id, { title: item.title, href: `/dashboard/projects/${item.id}` }]));
  const knowledgeMap = new Map((knowledgeResult.data ?? []).map((item) => [item.id, { title: item.title, href: `/dashboard/knowledge/${item.id}` }]));
  const skillMap = new Map((skillsResult.data ?? []).map((item) => [item.id, { title: item.name, href: `/dashboard/skills/${item.id}` }]));

  return (record: RelatedRecord) => {
    if (!record.related_type || !record.related_id) {
      return null;
    }

    const related = record.related_type === "publication"
      ? publicationMap.get(record.related_id)
      : record.related_type === "project"
        ? projectMap.get(record.related_id)
        : record.related_type === "knowledge"
          ? knowledgeMap.get(record.related_id)
          : skillMap.get(record.related_id);

    return related
      ? {
          type: record.related_type,
          title: related.title,
          href: related.href
        }
      : null;
  };
}

type DocumentRow = DocumentRecord & {
  document_collections?: Pick<DocumentCollectionRecord, "id" | "title" | "collection_type" | "root_folder_name" | "file_count" | "total_size"> | null;
};

function firstRelationAsRelated(document: Pick<DocumentWithRelation, "relations">) {
  const firstRelation = document.relations[0];

  return firstRelation
    ? {
        type: firstRelation.asset_type,
        title: firstRelation.title,
        href: firstRelation.href
      }
    : null;
}

async function resolveDocumentRelations(documents: DocumentRow[]): Promise<DocumentWithRelation[]> {
  const supabase = await createClient();
  const resolveRelated = await getRelatedResolver(documents);
  const relationsByDocumentId = supabase ? await getDocumentRelationsMap(supabase, documents) : new Map();

  return documents.map((document) => {
    const relations = relationsByDocumentId.get(document.id) ?? [];
    const related = resolveRelated(document);

    return {
      ...document,
      related: related ?? firstRelationAsRelated({ relations }),
      relations,
      collection: document.document_collections ?? null
    };
  });
}

async function resolveCollectionRelations(collections: DocumentCollectionRecord[]): Promise<DocumentCollectionWithRelation[]> {
  const supabase = await createClient();
  const resolveRelated = await getRelatedResolver(collections);
  const relationsByCollectionId = supabase ? await getDocumentCollectionRelationsMap(supabase, collections) : new Map();

  return collections.map((collection) => {
    const relations = relationsByCollectionId.get(collection.id) ?? [];
    const related = resolveRelated(collection);

    return {
      ...collection,
      related: related ?? firstRelationAsRelated({ relations }),
      relations
    };
  });
}

function hasRelation(
  item: Pick<DocumentWithRelation | DocumentCollectionWithRelation, "relations" | "related_type" | "related_id">,
  relatedType: string,
  relatedId?: string
) {
  if (relatedType === "unlinked") {
    return item.relations.length === 0 && !item.related_type && !item.related_id;
  }

  if (relatedType === "all") {
    return true;
  }

  return item.relations.some((relation) => (
    relation.asset_type === relatedType &&
    (!relatedId || relation.asset_id === relatedId)
  ));
}

function filterByRelation<T extends DocumentWithRelation | DocumentCollectionWithRelation>(
  items: T[],
  relatedType?: string,
  relatedId?: string
) {
  if (!relatedType || relatedType === "all") {
    return items;
  }

  return items.filter((item) => hasRelation(item, relatedType, relatedId));
}

export async function getDocuments(filters?: { category?: string; relatedType?: string; relatedId?: string; collection?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockDocumentFallback();
  }

  let query = supabase
    .from("documents")
    .select("*, document_collections(id,title,collection_type,root_folder_name,file_count,total_size)")
    .order("updated_at", { ascending: false });

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters?.collection === "with_collection") {
    query = query.not("collection_id", "is", null);
  }

  if (filters?.collection === "without_collection") {
    query = query.is("collection_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getDocuments failed", { code: error.code, message: error.message });
    return [];
  }

  const documents = await resolveDocumentRelations((data ?? []) as DocumentRow[]);
  return filterByRelation(documents, filters?.relatedType, filters?.relatedId);
}

export async function countDocuments() {
  const supabase = await createClient();

  if (!supabase) {
    return mockDocumentFallback().length;
  }

  const { count, error } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("countDocuments failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}

export async function getDocumentById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockDocumentFallback().find((document) => document.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*, document_collections(id,title,collection_type,root_folder_name,file_count,total_size)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getDocumentById failed", { code: error.code, message: error.message });
    return null;
  }

  if (!data) {
    return null;
  }

  const [document] = await resolveDocumentRelations([data as DocumentRow]);
  return document ?? null;
}

export async function getDocumentsByRelated(relatedType: DocumentRelatedType, relatedId: string) {
  return getDocuments({ relatedType, relatedId });
}

export async function getPublicDocumentCountByRelated(relatedType: DocumentRelatedType, relatedId: string) {
  const documents = await getDocumentsByRelated(relatedType, relatedId);
  return new Set(documents.filter((document) => document.visibility === "public").map((document) => document.id)).size;
}

export async function getDocumentCollectionById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("document_collections")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getDocumentCollectionById failed", { code: error.code, message: error.message });
    return null;
  }

  if (!data) {
    return null;
  }

  const [collection] = await resolveCollectionRelations([data as DocumentCollectionRecord]);
  return collection ?? null;
}

export async function getDocumentCollectionsByRelated(relatedType: DocumentRelatedType, relatedId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("document_collections")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getDocumentCollectionsByRelated failed", { code: error.code, message: error.message });
    return [];
  }

  const collections = await resolveCollectionRelations((data ?? []) as DocumentCollectionRecord[]);
  return filterByRelation(collections, relatedType, relatedId);
}

export async function getDocumentsByCollectionId(collectionId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*, document_collections(id,title,collection_type,root_folder_name,file_count,total_size)")
    .eq("collection_id", collectionId)
    .order("relative_path", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getDocumentsByCollectionId failed", { code: error.code, message: error.message });
    return [];
  }

  return resolveDocumentRelations((data ?? []) as DocumentRow[]);
}
