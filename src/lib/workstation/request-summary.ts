import type { WorkstationListParams } from "./query";

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
