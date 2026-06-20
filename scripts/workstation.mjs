#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_API_URL = "https://personal-workstation.vercel.app";
const API_URL_ENV = "WORKSTATION_API_URL";
const TOKEN_ENV = "WORKSTATION_API_TOKEN";
const REQUEST_TIMEOUT_MS = 15000;
const UPLOAD_REQUEST_TIMEOUT_MS = 60000;
const DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const DOCUMENT_UPLOAD_MAX_SIZE_LABEL = "10 MB";
const DOCUMENT_UPLOAD_SUPPORTED_TYPES_LABEL = "PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG, JPEG.";
const DOCUMENT_UPLOAD_MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg"
};
const DOCUMENT_UPLOAD_BLOCKED_EXTENSIONS = new Set(["app", "bat", "cmd", "com", "dmg", "exe", "msi", "ps1", "rar", "scr", "sh", "zip", "7z"]);
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
const VISIBILITY_FLAG_NAMES = new Set(["visibility"]);

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

  if (area === "document") {
    await runDocumentCommand(action, commandArgs);
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

  if (action === "show") {
    await runShow(assetType, args);
    return;
  }

  if (action === "create") {
    await runCreate(assetType, args);
    return;
  }

  if (action === "update") {
    await runUpdate(assetType, args);
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

async function runDocumentCommand(action, args) {
  if (action !== "upload") {
    throw new CliError(`Unknown document command: ${action ?? ""}`.trim());
  }

  const options = parseOptions(args, {
    "collection-id": "collectionId",
    "collection_id": "collectionId",
    file: "file",
    title: "title",
    category: "category"
  });
  const upload = await prepareDocumentUpload(options);

  if (!options.json) {
    printDocumentUploadPreparation(upload.metadata);
  }

  const intentResponse = await requestWorkstationApi("POST", "/api/workstation/documents/upload-intent", {
    body: upload.metadata,
    jsonOutput: options.json
  });
  const intent = intentResponse.body?.data;

  if (!intent?.upload_id || !intent?.storage_path) {
    throw new CliError("Workstation API did not return a valid upload intent.");
  }

  if (!options.json) {
    console.log("1/3 Created upload intent.");
  }

  const formData = new FormData();
  formData.set("upload_id", intent.upload_id);
  formData.set("collection_id", upload.metadata.collection_id);
  formData.set("storage_path", intent.storage_path);
  formData.set("filename", upload.metadata.filename);
  formData.set("mime_type", upload.metadata.mime_type);
  formData.set("size_bytes", String(upload.metadata.size_bytes));
  formData.set("category", upload.metadata.category);

  let bytes;

  try {
    bytes = await readFile(upload.absolutePath);
  } catch {
    throw new CliError("Unable to read selected upload file.");
  }

  const fileBlob = new Blob([bytes], { type: upload.metadata.mime_type });
  formData.set("file", fileBlob, upload.metadata.filename);

  await requestWorkstationApi("POST", "/api/workstation/documents/upload", {
    formData,
    jsonOutput: options.json,
    timeoutMs: UPLOAD_REQUEST_TIMEOUT_MS
  });

  if (!options.json) {
    console.log("2/3 Uploaded file to private storage.");
  }

  const finalizeResponse = await requestWorkstationApi("POST", "/api/workstation/documents/finalize", {
    body: {
      upload_id: intent.upload_id,
      collection_id: upload.metadata.collection_id,
      storage_path: intent.storage_path,
      title: upload.metadata.title,
      filename: upload.metadata.filename,
      mime_type: upload.metadata.mime_type,
      size_bytes: upload.metadata.size_bytes,
      category: upload.metadata.category
    },
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(finalizeResponse.body);
    return;
  }

  console.log("3/3 Finalized document metadata.");
  printUploadedDocument(finalizeResponse.body?.data ?? {});
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

async function runShow(assetType, args) {
  const options = parseOptions(args, {
    id: "id",
    slug: "slug"
  });
  const lookup = parseLookupOptions(options, assetType);
  const response = await requestWorkstationApi("GET", `/api/workstation/${assetEndpoint(assetType)}/${encodeURIComponent(lookup.value)}`, {
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(response.body);
    return;
  }

  printShown(assetType, response.body?.data ?? {});
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

async function runUpdate(assetType, args) {
  const specs = {
    project: {
      id: "id",
      slug: "slug",
      title: "title",
      summary: "summary",
      status: "status",
      progress: "progress",
      "start-date": "startDate",
      "start_date": "startDate",
      tags: "tags",
      background: "background",
      "background-file": "backgroundFile",
      "background_file": "backgroundFile",
      "research-question": "researchQuestion",
      "research_question": "researchQuestion",
      "research-question-file": "researchQuestionFile",
      "research_question_file": "researchQuestionFile",
      methodology: "methodology",
      "methodology-file": "methodologyFile",
      "methodology_file": "methodologyFile"
    },
    knowledge: {
      id: "id",
      slug: "slug",
      title: "title",
      category: "category",
      excerpt: "excerpt",
      content: "content",
      "content-file": "contentFile",
      "content_file": "contentFile",
      tags: "tags",
      "project-id": "projectId",
      "project_id": "projectId"
    },
    skill: {
      id: "id",
      slug: "slug",
      name: "name",
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
      "repository_url": "repositoryUrl"
    }
  };
  const options = parseOptions(args, specs[assetType], {
    rejectOwnerFields: true,
    rejectVisibility: true
  });
  const lookup = parseLookupOptions(options, assetType);
  const payload = await buildUpdatePayload(assetType, options);
  const id = await resolveUpdateId(assetType, lookup, options.json);
  const response = await requestWorkstationApi("PATCH", `/api/workstation/${assetEndpoint(assetType)}/${encodeURIComponent(id)}`, {
    body: payload,
    jsonOutput: options.json
  });

  if (options.json) {
    printJson(response.body);
    return;
  }

  printUpdated(assetType, response.body?.data ?? {}, Object.keys(payload));
}

function assetEndpoint(assetType) {
  return assetType === "knowledge" ? "knowledge" : `${assetType}s`;
}

async function resolveUpdateId(assetType, lookup, jsonOutput) {
  if (lookup.type === "id") {
    return lookup.value;
  }

  const response = await requestWorkstationApi("GET", `/api/workstation/${assetEndpoint(assetType)}/${encodeURIComponent(lookup.value)}`, {
    jsonOutput
  });
  const id = response.body?.data?.id;

  if (!id) {
    throw new CliError(`Unable to resolve ${assetType} slug to an id.`);
  }

  if (!jsonOutput) {
    console.log(`Resolved ${assetType} slug ${lookup.value} to id ${id}`);
  }

  return id;
}

function parseLookupOptions(options, assetType) {
  const id = options.id?.trim();
  const slug = options.slug?.trim();

  if (id && slug) {
    throw new CliError(`Use either --id or --slug for ${assetType}, not both.`);
  }

  if (!id && !slug) {
    throw new CliError(`Missing required option: use --id or --slug for ${assetType}.`);
  }

  return id
    ? { type: "id", value: id }
    : { type: "slug", value: slug };
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

async function buildUpdatePayload(assetType, options) {
  let payload;

  if (assetType === "project") {
    validateFilePair(options.background, options.backgroundFile, "background");
    validateFilePair(options.researchQuestion, options.researchQuestionFile, "research-question");
    validateFilePair(options.methodology, options.methodologyFile, "methodology");

    payload = stripUndefined({
      title: options.title,
      summary: options.summary,
      status: options.status,
      progress: options.progress === undefined ? undefined : parseProgress(options.progress),
      start_date: options.startDate === undefined ? undefined : parseStartDate(options.startDate),
      tags: options.tags === undefined ? undefined : parseCsv(options.tags),
      background: options.backgroundFile ? await readTextFile(options.backgroundFile) : options.background,
      research_question: options.researchQuestionFile ? await readTextFile(options.researchQuestionFile) : options.researchQuestion,
      methodology: options.methodologyFile ? await readTextFile(options.methodologyFile) : options.methodology
    });
  } else if (assetType === "knowledge") {
    if (options.content && options.contentFile) {
      throw new CliError("Use either --content or --content-file, not both.");
    }

    payload = stripUndefined({
      title: options.title,
      category: options.category,
      excerpt: options.excerpt,
      content: options.contentFile ? await readTextFile(options.contentFile) : options.content,
      tags: options.tags === undefined ? undefined : parseCsv(options.tags),
      project_id: options.projectId
    });
  } else {
    if (options.usage && options.usageFile) {
      throw new CliError("Use either --usage or --usage-file, not both.");
    }

    payload = stripUndefined({
      name: options.name,
      description: options.description,
      category: options.category,
      platforms: options.platforms === undefined ? undefined : parseCsv(options.platforms),
      status: options.status,
      content: options.content,
      usage_guide: options.usageFile ? await readTextFile(options.usageFile) : options.usage,
      input_description: options.inputDescription,
      output_description: options.outputDescription,
      current_version: options.currentVersion,
      repository_url: options.repositoryUrl
    });
  }

  if (Object.keys(payload).length === 0) {
    throw new CliError("At least one update field is required.");
  }

  return payload;
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

    if (config.rejectVisibility && VISIBILITY_FLAG_NAMES.has(name)) {
      throw new CliError("Visibility updates are not supported by the Workstation CLI.");
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

function validateFilePair(inlineValue, fileValue, fieldName) {
  if (inlineValue && fileValue) {
    throw new CliError(`Use either --${fieldName} or --${fieldName}-file, not both.`);
  }
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

function parseProgress(value) {
  const normalized = String(value).trim();

  if (!normalized) {
    throw new CliError("--progress must be an integer between 0 and 100.");
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed)) {
    throw new CliError("--progress must be an integer between 0 and 100.");
  }

  if (parsed < 0 || parsed > 100) {
    throw new CliError("--progress must be between 0 and 100.");
  }

  return parsed;
}

function parseStartDate(value) {
  const normalized = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    throw new CliError("--start-date must use YYYY-MM-DD.");
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new CliError("--start-date must be a valid date.");
  }

  return normalized;
}

async function prepareDocumentUpload(options) {
  requireOptions(options, ["collectionId", "file", "title", "category"]);

  const filePath = String(options.file).trim();
  const absolutePath = resolve(process.cwd(), filePath);
  let fileStats;

  try {
    fileStats = await stat(absolutePath);
  } catch {
    throw new CliError("Upload file does not exist or cannot be read.");
  }

  if (fileStats.isDirectory()) {
    throw new CliError("Upload file must be a regular file, not a directory.");
  }

  if (!fileStats.isFile()) {
    throw new CliError("Upload file must be a regular file.");
  }

  if (fileStats.size <= 0) {
    throw new CliError("Upload file must not be empty.");
  }

  if (fileStats.size > DOCUMENT_UPLOAD_MAX_SIZE_BYTES) {
    throw new CliError(`Upload file is too large. Maximum size: ${DOCUMENT_UPLOAD_MAX_SIZE_LABEL}.`);
  }

  const filename = basename(filePath);
  const extension = getDocumentUploadExtension(filename);

  if (!extension) {
    throw new CliError(unsupportedDocumentUploadTypeMessage());
  }

  if (DOCUMENT_UPLOAD_BLOCKED_EXTENSIONS.has(extension)) {
    throw new CliError(unsupportedDocumentUploadTypeMessage());
  }

  const mimeType = DOCUMENT_UPLOAD_MIME_BY_EXTENSION[extension];

  if (!mimeType) {
    throw new CliError(unsupportedDocumentUploadTypeMessage());
  }

  return {
    absolutePath,
    metadata: {
      collection_id: options.collectionId.trim(),
      filename,
      mime_type: mimeType,
      size_bytes: fileStats.size,
      title: options.title.trim(),
      category: options.category.trim()
    }
  };
}

function getDocumentUploadExtension(filename) {
  const cleanName = String(filename).replace(/\\/g, "/").split("/").pop()?.trim() ?? "";
  const parts = cleanName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
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
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const url = new URL(path, `${baseUrl}/`);
  const headers = {
    Authorization: `Bearer ${token}`
  };
  let body;

  if (method !== "GET") {
    if (options.formData) {
      body = options.formData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body ?? {});
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
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
    const message = sanitizeCliMessage(body.error.message ?? `HTTP ${status}`);

    console.error("Workstation API error:");
    console.error(`- code: ${body.error.code ?? "HTTP_ERROR"}`);
    console.error(`- message: ${message}`);
    if (body.requestId) {
      console.error(`- requestId: ${body.requestId}`);
    }

    for (const hint of getFriendlyApiHints(body.error, context)) {
      console.error(hint);
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

  return /permission denied for table (projects|knowledge_notes|skills|documents|document_collections)/i.test(String(message ?? ""));
}

function getFriendlyApiHints(error, context) {
  const message = String(error?.message ?? "");
  const code = String(error?.code ?? "");
  const hints = [];

  if (/permission denied for table (documents|document_collections)/i.test(message)) {
    hints.push("Hint: This usually means Supabase migration 0027_workstation_document_upload_grants.sql has not been applied.");
  } else if (shouldPrintServiceRoleGrantHint(message, context)) {
    hints.push("Hint: check Supabase service_role grants for the target table.");
  }

  if (isDocumentUploadContext(context) && (/document collection not found/i.test(message) || (code === "NOT_FOUND" && /collection/i.test(message)))) {
    hints.push("Hint: Collection not found. Run:");
    hints.push("npm run workstation -- collection list --limit 10");
  }

  if (isDocumentUploadContext(context) && isDocumentUploadTypeError(message)) {
    hints.push(`Hint: Supported types: ${DOCUMENT_UPLOAD_SUPPORTED_TYPES_LABEL}`);
  }

  if (isDocumentUploadContext(context) && isDocumentUploadSizeError(message)) {
    hints.push(`Hint: Maximum size: ${DOCUMENT_UPLOAD_MAX_SIZE_LABEL}.`);
  }

  return Array.from(new Set(hints));
}

function isDocumentUploadContext(context) {
  return String(context.path ?? "").startsWith("/api/workstation/documents/");
}

function isDocumentUploadTypeError(message) {
  return /extension is not supported|supported extension|mime_type does not match|mime type does not match|unsupported upload file type/i.test(String(message ?? ""));
}

function isDocumentUploadSizeError(message) {
  return /file size exceeds|too large|upload limit|maximum size/i.test(String(message ?? ""));
}

function sanitizeCliMessage(message) {
  return String(message)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/workstation-uploads\/collections\/[A-Za-z0-9._~/-]+/g, "[storage_path redacted]");
}

function printProjectList(items) {
  if (items.length === 0) {
    console.log("No projects found.");
    return;
  }

  printRows(["id", "title", "status", "visibility", "updated_at"], items.map((item) => [
    item.id,
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

  printRows(["id", "title", "category", "visibility", "updated_at"], items.map((item) => [
    item.id,
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

  printRows(["id", "name", "category", "status", "visibility", "updated_at"], items.map((item) => [
    item.id,
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

  printRows(["id", "title", "type", "file_count", "total_size", "updated_at"], items.map((item) => [
    item.id,
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

function printShown(assetType, data) {
  const label = assetType === "knowledge" ? "Knowledge note" : `${assetType[0].toUpperCase()}${assetType.slice(1)}`;
  const fields = showFields(assetType);

  console.log(`${label}:`);

  for (const field of fields) {
    console.log(`- ${field}: ${formatDetail(data[field])}`);
  }
}

function showFields(assetType) {
  if (assetType === "project") {
    return [
      "id",
      "title",
      "slug",
      "summary",
      "status",
      "visibility",
      "tags",
      "background",
      "research_question",
      "methodology",
      "updated_at",
      "created_at"
    ];
  }

  if (assetType === "knowledge") {
    return [
      "id",
      "title",
      "slug",
      "category",
      "excerpt",
      "content",
      "tags",
      "project_id",
      "visibility",
      "updated_at",
      "created_at"
    ];
  }

  return [
    "id",
    "name",
    "slug",
    "description",
    "category",
    "platforms",
    "status",
    "content",
    "usage_guide",
    "input_description",
    "output_description",
    "current_version",
    "repository_url",
    "visibility",
    "updated_at",
    "created_at"
  ];
}

function printUpdated(assetType, data, fields) {
  const label = assetType === "knowledge" ? "knowledge note" : assetType;
  const title = data.title ?? data.name ?? "(untitled)";

  console.log(`Updated ${label}:`);
  console.log(`- ${assetType === "skill" ? "name" : "title"}: ${title}`);
  console.log(`- id: ${data.id ?? "unknown"}`);
  console.log(`- visibility: ${data.visibility ?? "private"}`);
  console.log(`- updated_fields: ${fields.length > 0 ? fields.join(", ") : "none"}`);
}

function printUploadedDocument(data) {
  console.log("Uploaded document:");
  console.log(`- title: ${data.title ?? "(untitled)"}`);
  console.log(`- id: ${data.id ?? "unknown"}`);
  console.log(`- visibility: ${data.visibility ?? "private"}`);
  console.log(`- collection_id: ${data.collection_id ?? "unknown"}`);
}

function printDocumentUploadPreparation(metadata) {
  console.log("Preparing document upload:");
  console.log(`- file: ${metadata.filename}`);
  console.log(`- size: ${metadata.size_bytes} bytes`);
  console.log(`- mime_type: ${metadata.mime_type}`);
  console.log(`- collection_id: ${metadata.collection_id}`);
  console.log("- visibility: private");
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

function formatDetail(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized.length > 1000 ? `${normalized.slice(0, 1000)}...` : normalized;
}

function formatArray(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function unsupportedDocumentUploadTypeMessage() {
  return `Unsupported upload file type. Supported types: ${DOCUMENT_UPLOAD_SUPPORTED_TYPES_LABEL}`;
}

function printHelp() {
  console.log(`Workstation CLI MVP

Usage:
  npm run workstation -- health [--json]
  npm run workstation -- project list [--q text] [--visibility private] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- project show (--id id | --slug slug) [--json]
  npm run workstation -- project create --title text --slug slug --summary text [--status in_progress] [--tags a,b]
  npm run workstation -- project update (--id id | --slug slug) [--title text] [--summary text] [--status in_progress] [--progress 25] [--start-date YYYY-MM-DD] [--tags a,b] [--background text | --background-file path] [--research-question text | --research-question-file path] [--methodology text | --methodology-file path]
  npm run workstation -- knowledge list [--q text] [--category text] [--project-id id] [--visibility private] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- knowledge show (--id id | --slug slug) [--json]
  npm run workstation -- knowledge create --title text --slug slug --category text [--excerpt text] [--content text | --content-file path] [--tags a,b]
  npm run workstation -- knowledge update (--id id | --slug slug) [--title text] [--category text] [--excerpt text] [--content text | --content-file path] [--tags a,b] [--project-id id]
  npm run workstation -- skill list [--q text] [--category text] [--platform codex] [--visibility private] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- skill show (--id id | --slug slug) [--json]
  npm run workstation -- skill create --name text --slug slug --description text --category text [--platforms codex,github] [--usage text | --usage-file path]
  npm run workstation -- skill update (--id id | --slug slug) [--name text] [--description text] [--category text] [--platforms codex,github] [--status available] [--usage text | --usage-file path]
  npm run workstation -- collection list [--q text] [--related-type project] [--related-id id] [--limit 20] [--page 1] [--cursor 0] [--json]
  npm run workstation -- document upload --collection-id id --file path --title text --category research_material [--json]

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
