#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(process.env.PUBLIC_SMOKE_BASE_URL ?? "http://localhost:3000");
const siteUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "https://personal-workstation.vercel.app");
const siteName = "黄铭语研究工作站";
const publicRoutes = [
  "/",
  "/about",
  "/projects",
  "/publications",
  "/knowledge",
  "/skills"
];
const forbiddenPublicHtmlFragments = [
  "/access-request",
  "/viewer/login",
  "access_requests",
  "content_access_grants",
  "申请访问",
  "storage_path",
  "storage_bucket",
  "Storage path",
  "Storage 路径",
  "signedUrl",
  "signed_url",
  "file_path",
  "owner_id",
  "document_asset_links",
  "research_asset_links",
  "workspace-files"
];
const forbiddenSitemapFragments = [
  "/dashboard",
  "/api",
  "/access-request",
  "/public-files",
  "/login",
  "/viewer",
  "storage_path",
  "Storage path",
  "signed",
  "workspace-files"
];
const fallbackRoutes = [
  "/projects/codex-public-smoke-missing",
  "/publications/codex-public-smoke-missing",
  "/knowledge/codex-public-smoke-missing",
  "/skills/codex-public-smoke-missing"
];
const retiredRoutes = [
  "/access-request",
  "/viewer/login",
  "/viewer/callback",
  "/dashboard/access-requests",
  "/dashboard/access-grants"
];
const publicDownloadBoundaryRoutes = [
  "/public-files/codex-public-smoke-missing/download",
  "/public-files/codex-public-smoke-missing/download?asset_type=project",
  "/public-files/codex-public-smoke-missing/download?asset_id=codex-public-smoke-asset",
  "/public-files/codex-public-smoke-missing/download?asset_type=invalid&asset_id=codex-public-smoke-asset"
];

const results = [];

for (const route of publicRoutes) {
  const response = await fetchText(route);
  assertStatus(response, 200, route);
  assertNoForbiddenFragments(response.body, route);
  assertMetadata(response.body, route);
}

for (const route of fallbackRoutes) {
  const response = await fetchText(route);
  assertStatus(response, 200, route);
  assertNoForbiddenFragments(response.body, route);
  assertIncludes(getHead(response.body), "noindex, nofollow", `${route} fallback is noindex`);
  assertDoesNotInclude(response.body, "/access-request", `${route} fallback excludes access request CTA`);
  assertDoesNotInclude(response.body, "/viewer/login", `${route} fallback excludes viewer login`);
}

for (const route of retiredRoutes) {
  const response = await fetchText(route);
  assertRetiredRouteUnavailable(response, route);
  assertNoForbiddenFragments(response.body, route);
}

for (const route of publicDownloadBoundaryRoutes) {
  const response = await fetchText(route);
  assertStatus(response, 404, `${route} requires valid asset context`);
}

const sitemap = await fetchText("/sitemap.xml");
assertStatus(sitemap, 200, "sitemap");
for (const route of publicRoutes) {
  assertIncludes(sitemap.body, `${siteUrl}${route === "/" ? "/" : route}`, `sitemap includes ${route}`);
}
for (const fragment of forbiddenSitemapFragments) {
  assertDoesNotInclude(sitemap.body, fragment, `sitemap excludes ${fragment}`);
}

const robots = await fetchText("/robots.txt");
assertStatus(robots, 200, "robots");
for (const route of ["/", "/about", "/projects", "/publications", "/knowledge", "/skills"]) {
  assertMatches(robots.body, new RegExp(`Allow:\\s*${escapeRegExp(route)}(?:\\n|$)`), `robots allows ${route}`);
}
for (const route of ["/dashboard", "/api", "/viewer", "/login", "/access-request", "/public-files", "/storage", "/signed"]) {
  assertMatches(robots.body, new RegExp(`Disallow:\\s*${escapeRegExp(route)}(?:\\n|$)`), `robots disallows ${route}`);
}
assertIncludes(robots.body, `${siteUrl}/sitemap.xml`, "robots includes sitemap URL");

const detailPaths = getPublicDetailPathsFromSitemap(sitemap.body).slice(0, 12);
for (const path of detailPaths) {
  const response = await fetchText(path);
  assertStatus(response, 200, `public detail ${path}`);
  assertNoForbiddenFragments(response.body, `public detail ${path}`);
  assertMetadata(response.body, `public detail ${path}`);
}

printResults();

if (results.some((result) => !result.ok)) {
  process.exit(1);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function fetchText(path) {
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const response = await fetch(url, { redirect: "manual" });
  const body = await response.text();

  return {
    body,
    status: response.status,
    url
  };
}

function getHead(html) {
  return html.split("</head>")[0] ?? "";
}

function assertStatus(response, expectedStatus, label) {
  record(response.status === expectedStatus, label, `status ${response.status}`);
}

function assertRetiredRouteUnavailable(response, label) {
  const unavailableStatuses = [302, 303, 307, 308, 401, 403, 404, 405];
  record(unavailableStatuses.includes(response.status), `${label} retired route is unavailable`, `status ${response.status}`);
}

function assertNoForbiddenFragments(value, label) {
  for (const fragment of forbiddenPublicHtmlFragments) {
    assertDoesNotInclude(value, fragment, `${label} excludes ${fragment}`);
  }
}

function assertMetadata(html, label) {
  const head = getHead(html);
  const title = getTitle(head);

  record(Boolean(title), `${label} has title`, title ?? "missing");
  assertDoesNotInclude(title ?? "", `${siteName} | ${siteName}`, `${label} title avoids duplicate site name`);
  assertIncludes(head, "research-workstation-hero.png", `${label} uses public OG image`);
}

function getTitle(head) {
  return head.match(/<title>(.*?)<\/title>/i)?.[1] ?? null;
}

function getPublicDetailPathsFromSitemap(body) {
  const paths = [];
  const urlPattern = /<loc>(.*?)<\/loc>/g;

  for (const match of body.matchAll(urlPattern)) {
    const value = match[1];

    if (!value.startsWith(siteUrl)) {
      continue;
    }

    const path = value.slice(siteUrl.length) || "/";

    if (/^\/(projects|publications|knowledge|skills)\/[^/]+$/.test(path)) {
      paths.push(path);
    }
  }

  return paths;
}

function assertIncludes(value, fragment, label) {
  record(value.includes(fragment), label, fragment);
}

function assertDoesNotInclude(value, fragment, label) {
  record(!value.includes(fragment), label, fragment);
}

function assertMatches(value, pattern, label) {
  record(pattern.test(value), label, String(pattern));
}

function record(ok, name, detail) {
  results.push({ ok, name, detail });
}

function printResults() {
  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;

  for (const result of results) {
    const status = result.ok ? "ok" : "fail";
    console.log(`[${status}] ${result.name} (${result.detail})`);
  }

  console.log(`\nPublic launch smoke: ${passed} passed, ${failed} failed`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
