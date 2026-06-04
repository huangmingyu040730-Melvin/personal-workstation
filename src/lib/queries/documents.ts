import type { DocumentRecord, DocumentRelatedType, DocumentWithRelation } from "@/lib/content-types";
import { documents as mockDocuments } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

function mockDocumentFallback(): DocumentWithRelation[] {
  return mockDocuments.map((document) => ({
    id: document.id,
    name: document.name,
    category: "research_material",
    storage_bucket: "workspace-files",
    storage_path: `mock/${document.id}`,
    file_size: document.size.includes("MB") ? 2_400_000 : 128_000,
    mime_type: "application/pdf",
    related_type: null,
    related_id: null,
    visibility: "private",
    owner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related: null
  }));
}

async function resolveDocumentRelations(documents: DocumentRecord[]): Promise<DocumentWithRelation[]> {
  const supabase = await createClient();

  if (!supabase || documents.length === 0) {
    return documents.map((document) => ({ ...document, related: null }));
  }

  const idsByType = documents.reduce<Record<DocumentRelatedType, string[]>>((acc, document) => {
    if (document.related_type && document.related_id) {
      acc[document.related_type].push(document.related_id);
    }
    return acc;
  }, { publication: [], project: [], skill: [] });

  const [publicationsResult, projectsResult, skillsResult] = await Promise.all([
    idsByType.publication.length > 0
      ? supabase.from("publications").select("id,title").in("id", Array.from(new Set(idsByType.publication)))
      : Promise.resolve({ data: [], error: null }),
    idsByType.project.length > 0
      ? supabase.from("projects").select("id,title").in("id", Array.from(new Set(idsByType.project)))
      : Promise.resolve({ data: [], error: null }),
    idsByType.skill.length > 0
      ? supabase.from("skills").select("id,name").in("id", Array.from(new Set(idsByType.skill)))
      : Promise.resolve({ data: [], error: null })
  ]);

  if (publicationsResult.error || projectsResult.error || skillsResult.error) {
    console.error("resolveDocumentRelations failed", {
      publications: publicationsResult.error?.message,
      projects: projectsResult.error?.message,
      skills: skillsResult.error?.message
    });
  }

  const publicationMap = new Map((publicationsResult.data ?? []).map((item) => [item.id, { title: item.title, href: `/dashboard/publications/${item.id}` }]));
  const projectMap = new Map((projectsResult.data ?? []).map((item) => [item.id, { title: item.title, href: `/dashboard/projects/${item.id}` }]));
  const skillMap = new Map((skillsResult.data ?? []).map((item) => [item.id, { title: item.name, href: `/dashboard/skills/${item.id}` }]));

  return documents.map((document) => {
    if (!document.related_type || !document.related_id) {
      return { ...document, related: null };
    }

    const related =
      document.related_type === "publication"
        ? publicationMap.get(document.related_id)
        : document.related_type === "project"
          ? projectMap.get(document.related_id)
          : skillMap.get(document.related_id);

    return {
      ...document,
      related: related
        ? {
            type: document.related_type,
            title: related.title,
            href: related.href
          }
        : null
    };
  });
}

export async function getDocuments(filters?: { category?: string; relatedType?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockDocumentFallback();
  }

  let query = supabase.from("documents").select("*").order("updated_at", { ascending: false });

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters?.relatedType && filters.relatedType !== "all") {
    query = query.eq("related_type", filters.relatedType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getDocuments failed", { code: error.code, message: error.message });
    return [];
  }

  return resolveDocumentRelations((data ?? []) as DocumentRecord[]);
}

export async function getDocumentById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockDocumentFallback().find((document) => document.id === id) ?? null;
  }

  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getDocumentById failed", { code: error.code, message: error.message });
    return null;
  }

  if (!data) {
    return null;
  }

  const [document] = await resolveDocumentRelations([data as DocumentRecord]);
  return document ?? null;
}

export async function getDocumentsByRelated(relatedType: DocumentRelatedType, relatedId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("related_type", relatedType)
    .eq("related_id", relatedId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getDocumentsByRelated failed", { code: error.code, message: error.message });
    return [];
  }

  return resolveDocumentRelations((data ?? []) as DocumentRecord[]);
}
