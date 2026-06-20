#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_API_URL = "https://personal-workstation.vercel.app";
const API_URL_ENV = "WORKSTATION_API_URL";
const TOKEN_ENV = "WORKSTATION_API_TOKEN";
const REQUEST_TIMEOUT_MS = 15000;
const CREATE_FIELD_BLOCKLIST = new Set([
  "owner",
  "owner-id",
  "owner_id",
  "user",
  "user-id",
  "user_id",
  "created-by",
  "created_by",
  "createdby"
]);
const TOKEN_FLAG_NAMES = new Set(["token", "api-token", "api_token", "workstation-token", "workstation_token"]);

class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

async function main() {
  const args = normalizeArgs(process.argv.slice(2));

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  assertNoTokenFlags(args);

  const [area, ...rest] = args;

  if (area === "health") {
    await runHealth(rest);
    return;
  }

  const [action, ...commandArgs] = rest;

  if (area === "project") {
    await runAssetCommand("project", action, commandArgs);
    return;
  }

  if (area === "knowledge") {
    await runAssetCommand("knowledge", action, commandArgs);
    return;
  }

  if (area === "skill") {
    await runAssetCommand("skill", action, commandArgs);
    return;
  }

  if (area === "collection") {
    await runCollectionCommand(action, commandArgs);
    return;
  }

  throw new CliError(`Unknown command: ${area}`);
}

function normalizeArgs(args) {
  return args.filter((arg) => arg !== "--");
}

function assertNoTokenFlags(args) {
  for (const arg of args) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const name = arg.slice(2).split("=")[0]?.toLowerCase();

    if (TOKEN_FLAG_NAMES.has(name)) {
      throw new CliError("Do not pass Workstation API tokens as CLI flags. Set WORKSTATION_API_TOKEN in your local environment.");
    }
  }
}

async function runHealth(args) {
  const options = parseOptions(args, {});
  const response = await requestWorkstationApi("GET", "/api/workstation/health", {
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(response.body);
    return;
  }

  const data = response.body?.data ?? {};
  console.log(response.body?.message ?? "Workstation API is available");
  console.log(`apiVersion: ${data.apiVersion ?? response.body?.apiVersion ?? "unknown"}`);
  console.log(`auth: ${data.auth ?? "unknown"}`);
  console.log(`capabilities: ${formatArray(data.capabilities) || "none"}`);
  printDataAccess(data.dataAccess);
}

async function runAssetCommand(assetType, action, args) {
  if (action === "list") {
    await runList(assetType, args);
    return;
  }

  if (action === "create") {
    await runCreate(assetType, args);
    return;
  }

  throw new CliError(`Unknown ${assetType} command: ${action ?? ""}`.trim());
}

async function runCollectionCommand(action, args) {
  if (action !== "list") {
    throw new CliError(`Unknown collection command: ${action ?? ""}`.trim());
  }

  const options = parseOptions(args, {
    q: "q",
    "related-type": "relatedType",
    "related_type": "relatedType",
    "related_id": "relatedId",
    "related-id": "relatedId",
    limit: "limit",
    page: "page",
    cursor: "cursor"
  });
  const query = buildQuery({
    q: options.q,
    related_type: options.relatedType,
    related_id: options.relatedId,
    limit: options.limit,
    page: options.page,
    cursor: options.cursor
  });
  const response = await requestWorkstationApi("GET", `/api/workstation/document-collections${query}`, {
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(response.body);
    return;
  }

  printCollectionList(response.body?.data?.items ?? []);
}

async function runList(assetType, args) {
  const specs = {
    project: {
      q: "q",
      visibility: "visibility",
      limit: "limit",
      page: "page",
      cursor: "cursor"
    },
    knowledge: {
      q: "q",
      category: "category",
      "project-id": "projectId",
      "project_id": "projectId",
      visibility: "visibility",
      limit: "limit",
      page: "page",
      cursor: "cursor"
    },
    skill: {
      q: "q",
      category: "category",
      platform: "platform",
      visibility: "visibility",
      limit: "limit",
      page: "page",
      cursor: "cursor"
    }
  };
  const options = parseOptions(args, specs[assetType]);
  validateListVisibility(options.visibility);
  const query = buildQuery({
    q: options.q,
    category: options.category,
    platform: options.platform,
    project_id: assetType === "knowledge" ? options.projectId : undefined,
    visibility: options.visibility,
    limit: options.limit,
    page: options.page,
    cursor: options.cursor
  });
  const response = await requestWorkstationApi("GET", `/api/workstation/${assetEndpoint(assetType)}${query}`, {
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(response.body);
    return;
  }

  const items = response.body?.data?.items ?? [];

  if (assetType === "project") {
    printProjectList(items);
    return;
  }

  if (assetType === "knowledge") {
    printKnowledgeList(items);
    return;
  }

  printSkillList(items);
}

async function runCreate(assetType, args) {
  const specs = {
    project: {
      title: "title",
      slug: "slug",
      summary: "summary",
      status: "status",
      tags: "tags",
      background: "background",
      "research-question": "researchQuestion",
      "research_question": "researchQuestion",
      methodology: "methodology",
      visibility: "visibility"
    },
    knowledge: {
      title: "title",
      slug: "slug",
      category: "category",
      excerpt: "excerpt",
      content: "content",
      "content-file": "contentFile",
      "content_file": "contentFile",
      tags: "tags",
      "project-id": "projectId",
      "project_id": "projectId",
      visibility: "visibility"
    },
    skill: {
      name: "name",
      slug: "slug",
      description: "description",
      category: "category",
      platforms: "platforms",
      status: "status",
      content: "content",
      usage: "usage",
      "usage-file": "usageFile",
      "usage_file": "usageFile",
      "input-description": "inputDescription",
      "input_description": "inputDescription",
      "output-description": "outputDescription",
      "output_description": "outputDescription",
      "current-version": "currentVersion",
      "current_version": "currentVersion",
      "repository-url": "repositoryUrl",
      "repository_url": "repositoryUrl",
      visibility: "visibility"
    }
  };
  const options = parseOptions(args, specs[assetType], { rejectOwnerFields: true });
  const payload = await buildCreatePayload(assetType, options);
  const response = await requestWorkstationApi("POST", `/api/workstation/${assetEndpoint(assetType)}`, {
    body: payload,
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(response.body);
    return;
  }

  printCreated(assetType, response.body?.data ?? {});
}

function assetEndpoint(assetType) {
  return assetType === "knowledge" ? "knowledge" : `${assetType}s`;
}

async function buildCreatePayload(assetType, options) {
  validateCreateVisibility(options.visibility);

  if (assetType === "project") {
    requireOptions(options, ["title", "slug", "summary"]);

    return stripUndefined({
      title: options.title,
      slug: options.slug,
      summary: options.summary,
      status: options.status,
      tags: parseCsv(options.tags),
      background: options.background,
      research_question: options.researchQuestion,
      methodology: options.methodology
    });
  }

  if (assetType === "knowledge") {
    requireOptions(options, ["title", "slug", "category"]);

    if (options.content && options.contentFile) {
      throw new CliError("Use either --content or --content-file, not both.");
    }

    const content = options.contentFile ? await readTextFile(options.contentFile) : options.content;

    return stripUndefined({
      title: options.title,
      slug: options.slug,
      category: options.category,
      excerpt: options.excerpt,
      content,
      tags: parseCsv(options.tags),
      project_id: options.projectId
    });
  }

  requireOptions(options, ["name", "slug", "description", "category"]);

  if (options.usage && options.usageFile) {
    throw new CliError("Use either --usage or --usage-file, not both.");
  }

  const usage = options.usageFile ? await readTextFile(options.usageFile) : options.usage;

  return stripUndefined({
    name: options.name,
    slug: options.slug,
    description: options.description,
    category: options.category,
    platforms: parseCsv(options.platforms ?? "codex"),
    status: options.status,
    content: options.content,
    usage,
    input_description: options.inputDescription,
    output_description: options.outputDescription,
    current_version: options.currentVersion,
    repository_url: options.repositoryUrl
  });
}

function parseOptions(args, specs, config = {}) {
  const options = { json: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      throw new CliError(`Unexpected argument: ${arg}`);
    }

    const { name, value: inlineValue } = splitFlag(arg);

    if (name === "json") {
      options.json = true;
      continue;
    }

    if (TOKEN_FLAG_NAMES.has(name)) {
      throw new CliError("Do not pass Workstation API tokens as CLI flags. Set WORKSTATION_API_TOKEN in your local environment.");
    }

    if (config.rejectOwnerFields && CREATE_FIELD_BLOCKLIST.has(name)) {
      throw new CliError("Owner/user fields are not supported by the Workstation CLI.");
    }

    const target = specs[name];

    if (!target) {
      throw new CliError(`Unsupported option --${name}.`);
    }

    const value = inlineValue ?? args[index + 1];

    if (value === undefined || value.startsWith("--")) {
      throw new CliError(`Missing value for --${name}.`);
    }

    options[target] = value;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return options;
}

function splitFlag(arg) {
  const withoutPrefix = arg.slice(2);
  const equalsIndex = withoutPrefix.indexOf("=");

  if (equalsIndex === -1) {
    return {
      name: withoutPrefix.toLowerCase(),
      value: undefined
    };
  }

  return {
    name: withoutPrefix.slice(0, equalsIndex).toLowerCase(),
    value: withoutPrefix.slice(equalsIndex + 1)
  };
}

function requireOptions(options, names) {
  const missing = names.filter((name) => !options[name] || String(options[name]).trim() === "");

  if (missing.length > 0) {
    throw new CliError(`Missing required option(s): ${missing.map((name) => `--${toKebabCase(name)}`).join(", ")}.`);
  }
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function validateListVisibility(value) {
  if (!value) {
    return;
  }

  if (!["all", "public", "private", "unlisted"].includes(value)) {
    throw new CliError("--visibility must be one of all, public, private, or unlisted.");
  }
}

function validateCreateVisibility(value) {
  if (!value || value === "private") {
    return;
  }

  if (value === "public" || value === "unlisted") {
    throw new CliError("Workstation CLI MVP can only create private records. Public or unlisted visibility is not supported.");
  }

  throw new CliError("--visibility must be private for create commands.");
}

function parseCsv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readTextFile(filePath) {
  try {
    return await readFile(resolve(process.cwd(), filePath), "utf8");
  } catch (error) {
    throw new CliError(`Unable to read file: ${filePath}. ${error instanceof Error ? error.message : "Unknown error."}`);
  }
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function buildQuery(params) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function requestWorkstationApi(method, path, options = {}) {
  const token = process.env[TOKEN_ENV]?.trim();

  if (!token) {
    throw new CliError(`Missing WORKSTATION_API_TOKEN. Set it in your local environment before using the Workstation CLI.`);
  }

  const baseUrl = normalizeBaseUrl(process.env[API_URL_ENV]?.trim() || DEFAULT_API_URL);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(path, `${baseUrl}/`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: method === "GET" ? undefined : JSON.stringify(options.body ?? {}),
      signal: controller.signal
    });
    const text = await response.text();
    const parsed = parseJson(text);

    if (!response.ok) {
      handleApiFailure(response.status, parsed, options.jsonOutput, { method, path });
    }

    if (!parsed.ok) {
      handleApiFailure(response.status, parsed, options.jsonOutput, { method, path });
    }

    return { body: parsed, status: response.status };
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }

    const message = error?.name === "AbortError"
      ? "Unable to connect to Workstation API. Check WORKSTATION_API_URL or your network."
      : "Unable to connect to Workstation API. Check WORKSTATION_API_URL or your network.";

    throw new CliError(message);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new CliError("Workstation API returned a non-JSON response.");
  }
}

function handleApiFailure(status, body, jsonOutput, context = {}) {
  if (jsonOutput && body) {
    printJson(body);
  } else if (body?.error?.code || body?.error?.message) {
    console.error("Workstation API error:");
    console.error(`- code: ${body.error.code ?? "HTTP_ERROR"}`);
    console.error(`- message: ${body.error.message ?? `HTTP ${status}`}`);
    if (shouldPrintServiceRoleGrantHint(body.error.message, context)) {
      console.error("Hint: check Supabase service_role grants for the target table.");
    }
  } else {
    console.error("Workstation API error:");
    console.error(`- code: HTTP_${status}`);
    console.error("- message: Request failed and the response body was not recognized.");
  }

  process.exit(1);
}

function shouldPrintServiceRoleGrantHint(message, context) {
  if (context.method === "GET") {
    return false;
  }

  return /permission denied for table (projects|knowledge_notes|skills)/i.test(String(message ?? ""));
}

function printProjectList(items) {
  if (items.length === 0) {
    console.log("No projects found.");
    return;
  }

  printRows(["title", "status", "visibility", "updated_at"], items.map((item) => [
    item.title,
    item.status,
    item.visibility,
    item.updated_at
  ]));
}

function printKnowledgeList(items) {
  if (items.length === 0) {
    console.log("No knowledge notes found.");
    return;
  }

  printRows(["title", "category", "visibility", "updated_at"], items.map((item) => [
    item.title,
    item.category,
    item.visibility,
    item.updated_at
  ]));
}

function printSkillList(items) {
  if (items.length === 0) {
    console.log("No skills found.");
    return;
  }

  printRows(["name", "category", "status", "visibility", "updated_at"], items.map((item) => [
    item.name,
    item.category,
    item.status,
    item.visibility,
    item.updated_at
  ]));
}

function printCollectionList(items) {
  if (items.length === 0) {
    console.log("No document collections found.");
    return;
  }

  printRows(["title", "type", "file_count", "total_size", "updated_at"], items.map((item) => [
    item.title,
    item.collection_type ?? item.type,
    item.file_count,
    item.total_size,
    item.updated_at
  ]));
}

function printRows(headers, rows) {
  const normalizedRows = rows.map((row) => row.map((value) => formatCell(value)));
  const widths = headers.map((header, index) => Math.max(
    header.length,
    ...normalizedRows.map((row) => row[index].length)
  ));

  console.log(headers.map((header, index) => header.padEnd(widths[index])).join(" | "));
  console.log(widths.map((width) => "-".repeat(width)).join("-|-"));

  for (const row of normalizedRows) {
    console.log(row.map((value, index) => value.padEnd(widths[index])).join(" | "));
  }
}

function printCreated(assetType, data) {
  const label = assetType === "knowledge" ? "knowledge note" : assetType;
  const title = data.title ?? data.name ?? "(untitled)";

  console.log(`Created ${label}:`);
  console.log(`- ${assetType === "skill" ? "name" : "title"}: ${title}`);
  console.log(`- id: ${data.id ?? "unknown"}`);
  console.log(`- visibility: ${data.visibility ?? "private"}`);
}

function printDataAccess(dataAccess) {
  if (!dataAccess) {
    return;
  }

  console.log(`dataAccess: ${dataAccess.status ?? "unknown"}`);

  if (dataAccess.message) {
    console.log(`message: ${dataAccess.message}`);
  }

  if (!dataAccess.checks || typeof dataAccess.checks !== "object") {
    return;
  }

  for (const [name, check] of Object.entries(dataAccess.checks)) {
    console.log(`- ${name}.select: ${check?.select ?? "unknown"}`);
    if (check?.message) {
      console.log(`  message: ${check.message}`);
    }
  }
}

function formatCell(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").slice(0, 100);
}

function formatArray(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`Workstation CLI MVP

Usage:
  npm run workstation -- health [--json]
  npm run workstation -- project list [--q text] [--visibility private] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- project create --title text --slug slug --summary text [--status in_progress] [--tags a,b]
  npm run workstation -- knowledge list [--q text] [--category text] [--project-id id] [--visibility private] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- knowledge create --title text --slug slug --category text [--excerpt text] [--content text | --content-file path] [--tags a,b]
  npm run workstation -- skill list [--q text] [--category text] [--platform codex] [--visibility private] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- skill create --name text --slug slug --description text --category text [--platforms codex,github] [--usage text | --usage-file path]
  npm run workstation -- collection list [--q text] [--related-type project] [--related-id id] [--limit 20] [--page 1] [--cursor 0] [--json]

Environment:
  WORKSTATION_API_URL    Optional. Defaults to ${DEFAULT_API_URL}
  WORKSTATION_API_TOKEN  Required. Do not pass tokens as CLI flags.
`);
}

main().catch((error) => {
  if (error instanceof CliError) {
    console.error(error.message);
    process.exit(error.exitCode);
  }

  console.error(error instanceof Error ? error.message : "Unknown Workstation CLI error.");
  process.exit(1);
});
