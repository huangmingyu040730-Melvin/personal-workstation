import type { AccessRequestContentType } from "./content-types";

const allowedContentTypes: AccessRequestContentType[] = ["project", "publication", "skill", "knowledge", "other"];

const contentPathByType: Partial<Record<AccessRequestContentType, string>> = {
  project: "projects",
  publication: "publications",
  knowledge: "knowledge",
  skill: "skills"
};

const sourceLabels: Record<string, string> = {
  project_detail: "公开项目详情页",
  publication_detail: "公开成果详情页",
  knowledge_detail: "公开知识详情页",
  skill_detail: "公开 Skill 详情页",
  project_restricted: "项目未公开提示",
  publication_restricted: "成果未公开提示",
  knowledge_restricted: "知识未公开提示",
  skill_restricted: "Skill 未公开提示"
};

export type AccessRequestContext = {
  contentType: AccessRequestContentType | null;
  title: string | null;
  slug: string | null;
  from: string | null;
  sourceLabel: string;
  requestedContentUrl: string | null;
  hasContext: boolean;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function cleanText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeContentType(value: string | null | undefined) {
  const trimmed = cleanText(value, 32);
  return trimmed && allowedContentTypes.includes(trimmed as AccessRequestContentType)
    ? (trimmed as AccessRequestContentType)
    : null;
}

function normalizeSlug(value: string | null | undefined) {
  const trimmed = cleanText(value, 120);

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^\/+/, "").split(/[/?#]/)[0] || null;
}

function buildPublicContentPath(contentType: AccessRequestContentType | null, slug: string | null, from?: string | null) {
  if (!contentType || !slug || !contentPathByType[contentType]) {
    return null;
  }

  const path = `/${contentPathByType[contentType]}/${encodeURIComponent(slug)}`;

  if (!from) {
    return path;
  }

  const params = new URLSearchParams({ from });
  return `${path}?${params.toString()}`;
}

export function getAccessRequestSourceLabel(from: string | null | undefined) {
  if (!from) {
    return "未指定来源";
  }

  return sourceLabels[from] ?? from;
}

export function buildAccessRequestHref({
  contentType,
  slug,
  title,
  from
}: {
  contentType?: AccessRequestContentType | null;
  slug?: string | null;
  title?: string | null;
  from?: string | null;
}) {
  const params = new URLSearchParams();
  const safeType = normalizeContentType(contentType);
  const safeSlug = normalizeSlug(slug);
  const safeTitle = cleanText(title, 160);
  const safeFrom = cleanText(from, 60);

  if (safeType) {
    params.set("content_type", safeType);
  }

  if (safeSlug) {
    params.set("slug", safeSlug);
  }

  if (safeTitle) {
    params.set("title", safeTitle);
  }

  if (safeFrom) {
    params.set("from", safeFrom);
  }

  const query = params.toString();
  return query ? `/access-request?${query}` : "/access-request";
}

export function getAccessRequestContextFromSearchParams(params: Record<string, string | string[] | undefined>): AccessRequestContext {
  const contentType = normalizeContentType(firstParam(params.content_type) ?? firstParam(params.requested_content_type));
  const title = cleanText(firstParam(params.title) ?? firstParam(params.content_title), 160);
  const slug = normalizeSlug(firstParam(params.slug));
  const from = cleanText(firstParam(params.from), 60);
  const requestedContentUrl = buildPublicContentPath(contentType, slug, from);
  const hasContext = Boolean(contentType || title || slug || from || firstParam(params.content_id));

  return {
    contentType,
    title,
    slug,
    from,
    sourceLabel: getAccessRequestSourceLabel(from),
    requestedContentUrl,
    hasContext
  };
}

export function getAccessRequestContextFromStoredUrl(requestedContentUrl: string | null) {
  if (!requestedContentUrl) {
    return {
      sourceLabel: "未指定来源",
      slug: null as string | null,
      publicPath: null as string | null
    };
  }

  try {
    const url = new URL(requestedContentUrl, "https://local.invalid");
    const from = cleanText(url.searchParams.get("from"), 60);
    const slug = normalizeSlug(url.pathname.split("/").filter(Boolean).at(-1));

    return {
      sourceLabel: getAccessRequestSourceLabel(from),
      slug,
      publicPath: url.pathname
    };
  } catch {
    return {
      sourceLabel: "未指定来源",
      slug: null,
      publicPath: null
    };
  }
}

