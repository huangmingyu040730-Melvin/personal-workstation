import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/auth/admin";
import {
  getDocumentCategoryLabel,
  getDocumentCollectionTypeLabel,
  getDocumentRelatedTypeLabel,
  getPublicationTypeLabel
} from "@/lib/content-options";
import { getDocumentCollectionRelationsMap, getDocumentRelationsMap } from "@/lib/queries/document-asset-links";
import { formatFileSize } from "@/lib/format";
import type { DocumentRelatedType } from "@/lib/content-types";
import type { Visibility } from "@/lib/types";

export const WORKSPACE_SEARCH_MIN_QUERY_LENGTH = 2;
const WORKSPACE_SEARCH_LIMIT = 8;
const WORKSPACE_SEARCH_DESCRIPTION_LIMIT = 220;

export type WorkspaceSearchGroupKey = "projects" | "publications" | "knowledge" | "skills" | "documents" | "collections";
export type WorkspaceSearchType = "all" | WorkspaceSearchGroupKey;

const workspaceSearchTypeValues: WorkspaceSearchType[] = [
  "all",
  "projects",
  "publications",
  "knowledge",
  "skills",
  "documents",
  "collections"
];

export const WORKSPACE_SEARCH_GROUP_LABELS: Record<WorkspaceSearchGroupKey, string> = {
  projects: "Projects",
  publications: "Publications",
  knowledge: "Knowledge",
  skills: "Skills",
  documents: "Documents",
  collections: "文档包"
};

const WORKSPACE_SEARCH_RESULT_TYPE_LABELS: Record<WorkspaceSearchGroupKey, string> = {
  projects: "Project",
  publications: "Publication",
  knowledge: "Knowledge",
  skills: "Skill",
  documents: "Document",
  collections: "Collection"
};

export type WorkspaceSearchItem = {
  id: string;
  type: WorkspaceSearchGroupKey;
  typeLabel: string;
  title: string;
  description: string | null;
  href: string;
  metadata: string[];
  updatedAt: string | null;
};

export type WorkspaceSearchResults = Record<WorkspaceSearchGroupKey, WorkspaceSearchItem[]> & {
  query: string;
  totalCount: number;
};

type ProjectSearchRow = {
  id: string;
  title: string;
  summary: string;
  background: string | null;
  research_question: string | null;
  methodology: string | null;
  status: string;
  tags: string[];
  visibility: Visibility;
  updated_at: string;
};

type PublicationSearchRow = {
  id: string;
  title: string;
  publication_type: string;
  summary: string;
  abstract: string | null;
  published_on: string | null;
  tags: string[];
  visibility: Visibility;
  updated_at: string;
};

type KnowledgeSearchRow = {
  id: string;
  title: string;
  category: string;
  excerpt: string | null;
  content: string | null;
  tags: string[];
  visibility: Visibility;
  updated_at: string;
};

type SkillSearchRow = {
  id: string;
  name: string;
  description: string;
  content: string | null;
  category: string;
  platforms: string[];
  status: string;
  current_version: string | null;
  visibility: Visibility;
  updated_at: string;
};

type DocumentSearchRow = {
  id: string;
  name: string;
  category: string;
  original_name: string | null;
  relative_path: string | null;
  folder_path: string | null;
  related_type: string | null;
  related_id: string | null;
  updated_at: string;
  document_collections?: { id: string; title: string } | Array<{ id: string; title: string }> | null;
};

type CollectionSearchRow = {
  id: string;
  title: string;
  description: string | null;
  collection_type: string;
  root_folder_name: string | null;
  related_type: string | null;
  related_id: string | null;
  file_count: number;
  total_size: number;
  updated_at: string;
};

export function normalizeWorkspaceSearchQuery(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
}

export function normalizeWorkspaceSearchType(value: string | string[] | null | undefined): WorkspaceSearchType {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const type = (rawValue ?? "all").trim().toLowerCase();

  return workspaceSearchTypeValues.includes(type as WorkspaceSearchType) ? (type as WorkspaceSearchType) : "all";
}

export async function searchWorkspace(rawQuery: string): Promise<WorkspaceSearchResults> {
  const query = normalizeWorkspaceSearchQuery(rawQuery);
  const emptyResults = getEmptySearchResults(query);

  if (query.length < WORKSPACE_SEARCH_MIN_QUERY_LENGTH) {
    return emptyResults;
  }

  const databaseQuery = getDatabaseSearchQuery(query);

  if (databaseQuery.length < WORKSPACE_SEARCH_MIN_QUERY_LENGTH) {
    return emptyResults;
  }

  const { supabase, isAdmin } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return emptyResults;
  }

  const [projects, publications, knowledge, skills, documents, collections] = await Promise.all([
    searchProjects(supabase, databaseQuery),
    searchPublications(supabase, databaseQuery),
    searchKnowledge(supabase, databaseQuery),
    searchSkills(supabase, databaseQuery),
    searchDocuments(supabase, databaseQuery),
    searchCollections(supabase, databaseQuery)
  ]);

  return {
    query,
    projects,
    publications,
    knowledge,
    skills,
    documents,
    collections,
    totalCount: projects.length + publications.length + knowledge.length + skills.length + documents.length + collections.length
  };
}

function getEmptySearchResults(query: string): WorkspaceSearchResults {
  return {
    query,
    projects: [],
    publications: [],
    knowledge: [],
    skills: [],
    documents: [],
    collections: [],
    totalCount: 0
  };
}

function getDatabaseSearchQuery(query: string) {
  return query
    .replace(/[,%(){}]/g, " ")
    .replace(/[%*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIlikeOr(fields: string[], query: string) {
  const flexibleQuery = query.replace(/[\s_-]+/g, "%");
  const pattern = `%${flexibleQuery}%`;
  return fields.map((field) => `${field}.ilike.${pattern}`).join(",");
}

function compactMetadata(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function summarize(values: Array<string | null | undefined>, fallback: string) {
  const summary = values.find((value) => value?.trim())?.trim() ?? fallback;

  return summary.length > WORKSPACE_SEARCH_DESCRIPTION_LIMIT
    ? `${summary.slice(0, WORKSPACE_SEARCH_DESCRIPTION_LIMIT).trimEnd()}...`
    : summary;
}

function tagSummary(label: string, values: string[] | null | undefined) {
  return values && values.length > 0 ? `${label}：${values.slice(0, 4).join("、")}` : null;
}

function getVisibilityLabel(visibility: Visibility | string | null | undefined) {
  const labels: Record<string, string> = {
    public: "公开",
    private: "私密",
    unlisted: "链接可见"
  };

  return labels[visibility ?? ""] ?? "未知权限";
}

function mergeRowsById<T extends { id: string }>(groups: T[][]) {
  const rows = new Map<string, T>();

  groups.flat().forEach((row) => {
    if (!rows.has(row.id)) {
      rows.set(row.id, row);
    }
  });

  return Array.from(rows.values()).slice(0, WORKSPACE_SEARCH_LIMIT);
}

function getDocumentCollectionTitle(collection: DocumentSearchRow["document_collections"]) {
  if (Array.isArray(collection)) {
    return collection[0]?.title ?? null;
  }

  return collection?.title ?? null;
}

async function searchProjects(supabase: SupabaseClient, query: string): Promise<WorkspaceSearchItem[]> {
  const select = "id,title,summary,background,research_question,methodology,status,tags,visibility,updated_at";
  const [textResult, tagResult] = await Promise.all([
    supabase
      .from("projects")
      .select(select)
      .or(buildIlikeOr(["title", "summary", "background", "research_question", "methodology", "status"], query))
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT),
    supabase
      .from("projects")
      .select(select)
      .contains("tags", [query])
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT)
  ]);

  if (textResult.error || tagResult.error) {
    console.error("workspace search projects failed", {
      text: textResult.error ? { code: textResult.error.code, message: textResult.error.message } : null,
      tags: tagResult.error ? { code: tagResult.error.code, message: tagResult.error.message } : null
    });
  }

  return mergeRowsById([
    (textResult.data ?? []) as ProjectSearchRow[],
    (tagResult.data ?? []) as ProjectSearchRow[]
  ]).map((project) => ({
    id: project.id,
    type: "projects",
    typeLabel: WORKSPACE_SEARCH_RESULT_TYPE_LABELS.projects,
    title: project.title,
    description: summarize([project.summary, project.background, project.research_question, project.methodology], "尚未填写摘要。"),
    href: `/dashboard/projects/${project.id}`,
    metadata: compactMetadata([project.status, getVisibilityLabel(project.visibility), tagSummary("标签", project.tags)]),
    updatedAt: project.updated_at
  }));
}

async function searchPublications(supabase: SupabaseClient, query: string): Promise<WorkspaceSearchItem[]> {
  const select = "id,title,publication_type,summary,abstract,published_on,tags,visibility,updated_at";
  const [textResult, tagResult] = await Promise.all([
    supabase
      .from("publications")
      .select(select)
      .or(buildIlikeOr(["title", "summary", "abstract", "publication_type"], query))
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT),
    supabase
      .from("publications")
      .select(select)
      .contains("tags", [query])
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT)
  ]);

  if (textResult.error || tagResult.error) {
    console.error("workspace search publications failed", {
      text: textResult.error ? { code: textResult.error.code, message: textResult.error.message } : null,
      tags: tagResult.error ? { code: tagResult.error.code, message: tagResult.error.message } : null
    });
  }

  return mergeRowsById([
    (textResult.data ?? []) as PublicationSearchRow[],
    (tagResult.data ?? []) as PublicationSearchRow[]
  ]).map((publication) => ({
    id: publication.id,
    type: "publications",
    typeLabel: WORKSPACE_SEARCH_RESULT_TYPE_LABELS.publications,
    title: publication.title,
    description: summarize([publication.summary, publication.abstract], "尚未填写成果摘要。"),
    href: `/dashboard/publications/${publication.id}`,
    metadata: compactMetadata([
      getPublicationTypeLabel(publication.publication_type),
      publication.published_on ? `日期：${publication.published_on}` : null,
      getVisibilityLabel(publication.visibility),
      tagSummary("标签", publication.tags)
    ]),
    updatedAt: publication.updated_at
  }));
}

async function searchKnowledge(supabase: SupabaseClient, query: string): Promise<WorkspaceSearchItem[]> {
  const select = "id,title,category,excerpt,content,tags,visibility,updated_at";
  const [textResult, tagResult] = await Promise.all([
    supabase
      .from("knowledge_notes")
      .select(select)
      .or(buildIlikeOr(["title", "category", "excerpt", "content"], query))
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT),
    supabase
      .from("knowledge_notes")
      .select(select)
      .contains("tags", [query])
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT)
  ]);

  if (textResult.error || tagResult.error) {
    console.error("workspace search knowledge failed", {
      text: textResult.error ? { code: textResult.error.code, message: textResult.error.message } : null,
      tags: tagResult.error ? { code: tagResult.error.code, message: tagResult.error.message } : null
    });
  }

  return mergeRowsById([
    (textResult.data ?? []) as KnowledgeSearchRow[],
    (tagResult.data ?? []) as KnowledgeSearchRow[]
  ]).map((note) => ({
    id: note.id,
    type: "knowledge",
    typeLabel: WORKSPACE_SEARCH_RESULT_TYPE_LABELS.knowledge,
    title: note.title,
    description: summarize([note.excerpt, note.content], "尚未填写知识摘要。"),
    href: `/dashboard/knowledge/${note.id}`,
    metadata: compactMetadata([note.category, getVisibilityLabel(note.visibility), tagSummary("标签", note.tags)]),
    updatedAt: note.updated_at
  }));
}

async function searchSkills(supabase: SupabaseClient, query: string): Promise<WorkspaceSearchItem[]> {
  const select = "id,name,description,content,category,platforms,status,current_version,visibility,updated_at";
  const [textResult, platformResult] = await Promise.all([
    supabase
      .from("skills")
      .select(select)
      .or(buildIlikeOr(["name", "description", "content", "category", "status", "current_version"], query))
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT),
    supabase
      .from("skills")
      .select(select)
      .contains("platforms", [query])
      .order("updated_at", { ascending: false })
      .limit(WORKSPACE_SEARCH_LIMIT)
  ]);

  if (textResult.error || platformResult.error) {
    console.error("workspace search skills failed", {
      text: textResult.error ? { code: textResult.error.code, message: textResult.error.message } : null,
      platforms: platformResult.error ? { code: platformResult.error.code, message: platformResult.error.message } : null
    });
  }

  return mergeRowsById([
    (textResult.data ?? []) as SkillSearchRow[],
    (platformResult.data ?? []) as SkillSearchRow[]
  ]).map((skill) => ({
    id: skill.id,
    type: "skills",
    typeLabel: WORKSPACE_SEARCH_RESULT_TYPE_LABELS.skills,
    title: skill.name,
    description: summarize([skill.description, skill.content], "尚未填写 Skill 说明。"),
    href: `/dashboard/skills/${skill.id}`,
    metadata: compactMetadata([
      skill.category,
      skill.status,
      skill.current_version ? `版本：${skill.current_version}` : null,
      tagSummary("平台", skill.platforms),
      getVisibilityLabel(skill.visibility)
    ]),
    updatedAt: skill.updated_at
  }));
}

async function searchDocuments(supabase: SupabaseClient, query: string): Promise<WorkspaceSearchItem[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id,name,category,original_name,relative_path,folder_path,related_type,related_id,updated_at,document_collections(id,title)")
    .or(buildIlikeOr(["name", "original_name", "relative_path", "folder_path", "category", "related_type"], query))
    .order("updated_at", { ascending: false })
    .limit(WORKSPACE_SEARCH_LIMIT);

  if (error) {
    console.error("workspace search documents failed", { code: error.code, message: error.message });
  }

  const rows = (data ?? []) as DocumentSearchRow[];
  const relationsByDocumentId = await getDocumentRelationsMap(supabase, rows.map((document) => ({
    id: document.id,
    related_type: document.related_type as DocumentRelatedType | null,
    related_id: document.related_id
  })));

  return rows.map((document) => {
    const collectionTitle = getDocumentCollectionTitle(document.document_collections);
    const relations = relationsByDocumentId.get(document.id) ?? [];

    return {
      id: document.id,
      type: "documents",
      typeLabel: WORKSPACE_SEARCH_RESULT_TYPE_LABELS.documents,
      title: document.name,
      description: summarize([
        document.original_name ? `原始文件名：${document.original_name}` : null,
        document.relative_path ? `相对路径：${document.relative_path}` : null,
        document.folder_path ? `文件夹：${document.folder_path}` : null
      ], "文件 metadata 待补充。"),
      href: `/dashboard/documents/${document.id}`,
      metadata: compactMetadata([
        getDocumentCategoryLabel(document.category),
        relations.length > 0 ? `关联：${relations.slice(0, 3).map((relation) => relation.title).join("、")}${relations.length > 3 ? " 等" : ""}` : getDocumentRelatedTypeLabel(document.related_type),
        document.original_name ? `原始文件名：${document.original_name}` : null,
        document.relative_path ? `相对路径：${document.relative_path}` : null,
        document.folder_path ? `文件夹：${document.folder_path}` : null,
        collectionTitle ? `文档包：${collectionTitle}` : null
      ]),
      updatedAt: document.updated_at
    };
  });
}

async function searchCollections(supabase: SupabaseClient, query: string): Promise<WorkspaceSearchItem[]> {
  const { data, error } = await supabase
    .from("document_collections")
    .select("id,title,description,collection_type,root_folder_name,related_type,related_id,file_count,total_size,updated_at")
    .or(buildIlikeOr(["title", "description", "collection_type", "root_folder_name", "related_type"], query))
    .order("updated_at", { ascending: false })
    .limit(WORKSPACE_SEARCH_LIMIT);

  if (error) {
    console.error("workspace search collections failed", { code: error.code, message: error.message });
  }

  const rows = (data ?? []) as CollectionSearchRow[];
  const relationsByCollectionId = await getDocumentCollectionRelationsMap(supabase, rows.map((collection) => ({
    id: collection.id,
    related_type: collection.related_type as DocumentRelatedType | null,
    related_id: collection.related_id
  })));

  return rows.map((collection) => {
    const relations = relationsByCollectionId.get(collection.id) ?? [];

    return {
      id: collection.id,
      type: "collections",
      typeLabel: WORKSPACE_SEARCH_RESULT_TYPE_LABELS.collections,
      title: collection.title,
      description: summarize([collection.description, collection.root_folder_name], "文档包 metadata 待补充。"),
      href: `/dashboard/documents/collections/${collection.id}`,
      metadata: compactMetadata([
        getDocumentCollectionTypeLabel(collection.collection_type),
        `${collection.file_count} 个文件`,
        `总大小：${formatFileSize(collection.total_size)}`,
        relations.length > 0 ? `关联：${relations.slice(0, 3).map((relation) => relation.title).join("、")}${relations.length > 3 ? " 等" : ""}` : getDocumentRelatedTypeLabel(collection.related_type),
        collection.root_folder_name ? `根文件夹：${collection.root_folder_name}` : null
      ]),
      updatedAt: collection.updated_at
    };
  });
}
