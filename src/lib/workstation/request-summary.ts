import type { WorkstationListParams } from "./query";
import type { WorkstationLookupType } from "./query";

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
