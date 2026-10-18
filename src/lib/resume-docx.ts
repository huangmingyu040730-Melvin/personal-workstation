import { readFileSync } from "node:fs";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import PizZip from "pizzip";
import { referenceResumeTemplatePath, renderReferenceDocument } from "@/lib/resume-reference";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { buildResumeTemplateModel, getExportableResumeVersionItems } from "@/lib/resume-template-model";

type ResumeDocxInput = {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
};

type ResumePhotoMime = "image/jpeg" | "image/png" | "image/webp";
type ResumePhotoExtension = "jpeg" | "png" | "webp";

type ResumePhotoAsset = {
  buffer: Buffer;
  extension: ResumePhotoExtension;
  mimeType: ResumePhotoMime;
};

const resumePhotoRelationshipId = "rId11";
const maxResumePhotoBytes = 2 * 1024 * 1024;
const maxResumePhotoRedirects = 3;
const resumePhotoMimeExtensions = new Map<ResumePhotoMime, ResumePhotoExtension>([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export function getExportableResumeItems(version: ResumeVersionWithItems) {
  return getExportableResumeVersionItems(version);
}

export async function buildResumeDocx({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const photoAsset = model.profile.showPhoto && model.profile.photoUrl ? await getResumePhotoAsset(model.profile.photoUrl) : null;
  // Every version, including manually created and historical materials, uses
  // the native Word template. Source metadata is only needed for exact run restoration.
  const zip = new PizZip(readFileSync(referenceResumeTemplatePath));
  zip.file("word/document.xml", renderReferenceDocument(zip.file("word/document.xml")!.asText(), { version, profile, basicItem }));
  applyResumePhoto(zip, {
    showPhoto: model.profile.showPhoto,
    photoAsset
  });
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

export function getResumeDocxFilename({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const name = sanitizeFilename(model.profile.name || version.title || "resume");
  const target = sanitizeFilename(version.target_role || version.title || "简历");
  return `${name}-${target}.docx`;
}

async function getResumePhotoAsset(photoUrl: string): Promise<ResumePhotoAsset | null> {
  try {
    const source = photoUrl.trim();

    if (!source) {
      return null;
    }

    if (source.startsWith("data:")) {
      return getDataUrlPhotoAsset(source);
    }

    const url = new URL(source);

    if (url.protocol !== "https:") {
      throw new Error("resume photo URL must use HTTPS");
    }

    return await fetchHttpsPhotoAsset(url);
  } catch (error) {
    console.warn("resume docx photo skipped", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    return null;
  }
}

function applyResumePhoto(zip: PizZip, { showPhoto, photoAsset }: { showPhoto: boolean; photoAsset: ResumePhotoAsset | null }) {
  if (!showPhoto || !photoAsset) {
    removeResumePhotoPlaceholder(zip);
    return;
  }

  const mediaTarget = `media/resume-photo.${photoAsset.extension}`;
  zip.file(`word/${mediaTarget}`, photoAsset.buffer);
  updateResumePhotoRelationship(zip, mediaTarget);
  ensureImageContentType(zip, photoAsset.extension, photoAsset.mimeType);
}

function removeResumePhotoPlaceholder(zip: PizZip) {
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) return;

  // Remove the drawing, keeping the source header grid and centered name intact.
  const drawingPattern = new RegExp(`<w:drawing\\b(?:(?!</w:drawing>)[\\s\\S])*?r:embed="${resumePhotoRelationshipId}"(?:(?!</w:drawing>)[\\s\\S])*?</w:drawing>`, "g");
  zip.file("word/document.xml", documentFile.asText().replace(drawingPattern, ""));
}

function updateResumePhotoRelationship(zip: PizZip, mediaTarget: string) {
  const relsFile = zip.file("word/_rels/document.xml.rels");

  if (!relsFile) {
    return;
  }

  const relsXml = relsFile.asText();
  const relationshipPattern = new RegExp(`(<Relationship\\b(?=[^>]*\\bId="${resumePhotoRelationshipId}")[^>]*\\bTarget=")[^"]+(")`);
  const updated = relsXml.replace(relationshipPattern, `$1${mediaTarget}$2`);
  zip.file("word/_rels/document.xml.rels", updated);
}

function ensureImageContentType(zip: PizZip, extension: ResumePhotoExtension, mimeType: ResumePhotoMime) {
  if (extension === "jpeg" || extension === "png") {
    return;
  }

  const contentTypesFile = zip.file("[Content_Types].xml");

  if (!contentTypesFile) {
    return;
  }

  const contentTypesXml = contentTypesFile.asText();

  if (contentTypesXml.includes(`Extension="${extension}"`)) {
    return;
  }

  zip.file(
    "[Content_Types].xml",
    contentTypesXml.replace("</Types>", `<Default Extension="${extension}" ContentType="${mimeType}"/></Types>`)
  );
}

function getDataUrlPhotoAsset(source: string): ResumePhotoAsset {
  const commaIndex = source.indexOf(",");

  if (commaIndex === -1) {
    throw new Error("resume photo data URL is malformed");
  }

  const metadata = source.slice(0, commaIndex);
  const payload = source.slice(commaIndex + 1);
  const mimeType = normalizeResumePhotoMime(metadata.slice(5).split(";")[0]);

  if (!metadata.toLowerCase().includes(";base64") || !mimeType) {
    throw new Error("resume photo data URL must be a base64 jpeg, png, or webp image");
  }

  const buffer = Buffer.from(payload, "base64");

  if (buffer.byteLength === 0 || buffer.byteLength > maxResumePhotoBytes) {
    throw new Error("resume photo data URL exceeds the 2 MB limit");
  }

  return {
    buffer,
    extension: resumePhotoMimeExtensions.get(mimeType) ?? "jpeg",
    mimeType
  };
}

async function fetchHttpsPhotoAsset(initialUrl: URL): Promise<ResumePhotoAsset> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= maxResumePhotoRedirects; redirectCount += 1) {
    await assertSafeHttpsImageUrl(currentUrl);
    const response = await fetchWithTimeout(currentUrl);

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("resume photo redirect is missing a location");
      }

      currentUrl = new URL(location, currentUrl);

      if (currentUrl.protocol !== "https:") {
        throw new Error("resume photo redirect must stay on HTTPS");
      }

      continue;
    }

    if (!response.ok) {
      throw new Error(`resume photo request failed with status ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (contentLength > maxResumePhotoBytes) {
      throw new Error("resume photo exceeds the 2 MB limit");
    }

    const mimeType = normalizeResumePhotoMime(response.headers.get("content-type"));

    if (!mimeType) {
      throw new Error("resume photo response must be jpeg, png, or webp");
    }

    const buffer = await readResponseBuffer(response);

    return {
      buffer,
      extension: resumePhotoMimeExtensions.get(mimeType) ?? "jpeg",
      mimeType
    };
  }

  throw new Error("resume photo redirected too many times");
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(url, {
      headers: {
        accept: "image/jpeg,image/png,image/webp"
      },
      redirect: "manual",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBuffer(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > maxResumePhotoBytes) {
      throw new Error("resume photo exceeds the 2 MB limit");
    }

    return buffer;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxResumePhotoBytes) {
      throw new Error("resume photo exceeds the 2 MB limit");
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, totalBytes);
}

async function assertSafeHttpsImageUrl(url: URL) {
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error("resume photo URL must be a plain HTTPS image URL");
  }

  if (url.pathname.includes("/storage/v1/object")) {
    throw new Error("resume photo URL cannot target Supabase Storage object URLs");
  }

  const host = url.hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("resume photo URL cannot target localhost");
  }

  if (isIP(host)) {
    assertPublicIp(host);
    return;
  }

  const addresses = await lookup(host, {
    all: true,
    verbatim: true
  });

  if (addresses.length === 0) {
    throw new Error("resume photo host did not resolve");
  }

  for (const address of addresses) {
    assertPublicIp(address.address);
  }
}

function assertPublicIp(address: string) {
  if (isPrivateOrReservedIp(address)) {
    throw new Error("resume photo URL cannot target private or reserved network addresses");
  }
}

function isPrivateOrReservedIp(address: string) {
  const family = isIP(address);

  if (family === 4) {
    return isPrivateOrReservedIpv4(address);
  }

  if (family === 6) {
    return isPrivateOrReservedIpv6(address);
  }

  return true;
}

function isPrivateOrReservedIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 2) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateOrReservedIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mappedIpv4) {
    return isPrivateOrReservedIpv4(mappedIpv4[1]);
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("2001:db8") ||
    normalized.startsWith("ff")
  );
}

function normalizeResumePhotoMime(value: string | null | undefined): ResumePhotoMime | null {
  const mimeType = value?.split(";")[0]?.trim().toLowerCase();

  if (mimeType === "image/jpg") {
    return "image/jpeg";
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp") {
    return mimeType;
  }

  return null;
}

function isRedirectStatus(status: number) {
  return status >= 300 && status < 400;
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return sanitized || "resume";
}
