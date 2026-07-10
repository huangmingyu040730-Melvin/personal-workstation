import type { WorkstationListParams } from "./query";
import type { WorkstationLookupType } from "./query";
import type { WorkstationCareerListParams } from "./career-query";
import { getWorkstationDocumentFilenameExt } from "./document-upload-schemas";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, limit = 120) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, limit)
    : undefined;
}

function booleanPresence(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function arrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function fieldNames(input: Record<string, unknown>, allowedFields: string[]) {
  return allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(input, field));
}

export function summarizeListRequest(params: WorkstationListParams) {
  return {
    q: params.q,
    visibility: params.visibility,
    limit: params.limit,
    page: params.page,
    cursor: params.offset,
    category: params.category,
    platform: params.platform,
    related_type: params.relatedType,
    related_id: params.relatedId,
    project_id: params.projectId
  };
}

export function summarizeHealthRequest(dataAccess: { status?: string } | null | undefined) {
  return {
    data_access_status: dataAccess?.status ?? "unknown"
  };
}

export function summarizeShowRequest(lookup: string, lookupType: WorkstationLookupType) {
  return {
    lookup: text(lookup, 120),
    lookup_type: lookupType
  };
}

export function summarizeCollectionShowRequest(collectionId: string) {
  return {
    collection_id: text(collectionId, 80)
  };
}

export function summarizeCareerListRequest(params: WorkstationCareerListParams) {
  return {
    q: params.q,
    limit: params.limit,
    page: params.page,
    cursor: params.offset,
    item_type: params.itemType,
    status: params.status,
    version_id: params.versionId,
    direction: params.direction,
    channel: params.channel
  };
}

export function summarizeCareerCreateRequest(kind: "resume_item" | "resume_version" | "resume_jd_review", input: unknown) {
  const body = asRecord(input);

  if (kind === "resume_item") {
    return {
      item_type: text(body.item_type, 40),
      title: text(body.title),
      bullets_count: arrayCount(body.bullets),
      skills_count: arrayCount(body.skills),
      tags_count: arrayCount(body.tags),
      has_summary: booleanPresence(body.summary),
      has_details: Object.keys(asRecord(body.details)).length > 0
    };
  }

  if (kind === "resume_version") {
    return {
      title: text(body.title),
      target_role: text(body.target_role),
      language: text(body.language, 20),
      template_key: text(body.template_key, 40),
      items_count: arrayCount(body.items)
    };
  }

  return {
    resume_version_id: text(body.resume_version_id, 80),
    company_name: text(body.company_name),
    job_title: text(body.job_title),
    application_status: text(body.application_status, 40),
    has_jd_text: booleanPresence(body.jd_text),
    jd_text_length: typeof body.jd_text === "string" ? body.jd_text.length : 0,
    target_keywords_count: arrayCount(body.target_keywords)
  };
}

export function summarizeCareerUpdateRequest(id: string, kind: "resume_item" | "resume_version" | "resume_jd_review", input: unknown) {
  const body = asRecord(input);
  const allowed = kind === "resume_item"
    ? ["item_type", "title", "organization", "role_title", "location", "start_date", "end_date", "is_current", "summary", "bullets", "skills", "tags", "details", "sort_order", "is_featured", "related_project_id", "related_publication_id", "related_knowledge_id", "related_skill_id"]
    : kind === "resume_version"
      ? ["title", "target_role", "summary", "language", "template_key", "is_active", "is_featured", "notes", "profile_fields", "section_order", "template_options", "items"]
      : ["company_name", "job_title", "job_direction", "job_location", "application_channel", "application_status", "notes"];

  return {
    id: text(id, 80),
    fields: fieldNames(body, allowed),
    items_count: kind === "resume_version" ? arrayCount(body.items) : undefined,
    bullets_count: kind === "resume_item" ? arrayCount(body.bullets) : undefined,
    skills_count: kind === "resume_item" ? arrayCount(body.skills) : undefined
  };
}

export function summarizeCareerAnalyzeRequest(input: unknown) {
  const body = asRecord(input);
  return {
    resume_version_id: text(body.resume_version_id, 80),
    company_name: text(body.company_name),
    job_title: text(body.job_title),
    direction: text(body.direction, 40),
    application_status: text(body.application_status, 40),
    has_jd_text: booleanPresence(body.jd_text),
    jd_text_length: typeof body.jd_text === "string" ? body.jd_text.length : 0
  };
}

export function summarizeCareerDeleteRequest(id: string) {
  return { id: text(id, 80), confirmed: true };
}

export function summarizeDocumentUploadRequest(input: unknown) {
  const body = asRecord(input);
  const filename = text(body.filename, 240);

  return {
    collection_id: text(body.collection_id, 80),
    filename_ext: filename ? getWorkstationDocumentFilenameExt(filename) : undefined,
    mime_type: text(body.mime_type, 120),
    size_bytes: typeof body.size_bytes === "number" ? body.size_bytes : undefined,
    category: text(body.category, 80)
  };
}

export function summarizeProjectCreateRequest(input: unknown) {
  const body = asRecord(input);

  return {
    title: text(body.title),
    slug: text(body.slug, 80),
    status: text(body.status, 40),
    tags_count: arrayCount(body.tags),
    has_background: booleanPresence(body.background),
    has_research_question: booleanPresence(body.research_question),
    has_methodology: booleanPresence(body.methodology)
  };
}

export function summarizeProjectUpdateRequest(id: string, input: unknown) {
  const body = asRecord(input);

  return {
    id: text(id, 80),
    fields: fieldNames(body, ["title", "summary", "status", "progress", "start_date", "tags", "background", "research_question", "methodology"]),
    tags_count: arrayCount(body.tags),
    has_progress: Object.prototype.hasOwnProperty.call(body, "progress"),
    has_start_date: Object.prototype.hasOwnProperty.call(body, "start_date"),
    has_background: booleanPresence(body.background),
    has_research_question: booleanPresence(body.research_question),
    has_methodology: booleanPresence(body.methodology)
  };
}

export function summarizeKnowledgeCreateRequest(input: unknown) {
  const body = asRecord(input);

  return {
    title: text(body.title),
    slug: text(body.slug, 80),
    category: text(body.category, 80),
    project_id: text(body.project_id, 80),
    tags_count: arrayCount(body.tags),
    has_excerpt: booleanPresence(body.excerpt),
    has_content: booleanPresence(body.content)
  };
}

export function summarizeKnowledgeUpdateRequest(id: string, input: unknown) {
  const body = asRecord(input);

  return {
    id: text(id, 80),
    fields: fieldNames(body, ["title", "category", "excerpt", "content", "tags", "project_id"]),
    tags_count: arrayCount(body.tags),
    has_excerpt: booleanPresence(body.excerpt),
    has_content: booleanPresence(body.content),
    project_id: text(body.project_id, 80)
  };
}

export function summarizeSkillCreateRequest(input: unknown) {
  const body = asRecord(input);

  return {
    name: text(body.name),
    slug: text(body.slug, 80),
    category: text(body.category, 80),
    status: text(body.status, 40),
    platforms_count: arrayCount(body.platforms),
    has_content: booleanPresence(body.content),
    has_usage: booleanPresence(body.usage) || booleanPresence(body.usage_guide),
    has_input_description: booleanPresence(body.input_description),
    has_output_description: booleanPresence(body.output_description)
  };
}

export function summarizeSkillUpdateRequest(id: string, input: unknown) {
  const body = asRecord(input);

  return {
    id: text(id, 80),
    fields: fieldNames(body, [
      "name",
      "description",
      "category",
      "platforms",
      "status",
      "content",
      "usage_guide",
      "input_description",
      "output_description",
      "current_version",
      "repository_url"
    ]),
    platforms_count: arrayCount(body.platforms),
    has_content: booleanPresence(body.content),
    has_usage: booleanPresence(body.usage_guide),
    has_input_description: booleanPresence(body.input_description),
    has_output_description: booleanPresence(body.output_description)
  };
}
