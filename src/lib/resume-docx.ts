import { readFileSync } from "node:fs";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { buildResumeTemplateModel, getExportableResumeVersionItems, type ResumeTemplateEntry, type ResumeTemplateModel } from "@/lib/resume-template-model";

type ResumeDocxInput = {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
};

type ResumeDocxTemplateData = {
  name: string;
  genderRow: string;
  ageRow: string;
  phoneRow: string;
  emailRow: string;
  contactLine: string;
  education: ResumeDocxTemplateEntry[];
  experience: ResumeDocxTemplateEntry[];
  projects: ResumeDocxTemplateEntry[];
  campus: ResumeDocxTemplateEntry[];
  skills: ResumeDocxTemplateSkillEntry[];
  extraSections: Array<{
    label: string;
    entries: ResumeDocxTemplateEntry[];
  }>;
};

type ResumeDocxTemplateEntry = {
  date: string;
  title: string;
  subtitle: string;
  summary: string;
  detailLines: string[];
  bullets: ResumeDocxBullet[];
  tokenLines: string[];
};

type ResumeDocxTemplateSkillEntry = {
  label: string;
  text: string;
  bullets: ResumeDocxBullet[];
};

type ResumeDocxBullet = {
  label: string;
  text: string;
};

type ResumePhotoMime = "image/jpeg" | "image/png" | "image/webp";
type ResumePhotoExtension = "jpeg" | "png" | "webp";

type ResumePhotoAsset = {
  buffer: Buffer;
  extension: ResumePhotoExtension;
  mimeType: ResumePhotoMime;
};

const templatePath = path.join(process.cwd(), "src/templates/resume/20260523-resume-template.docx");
const resumePhotoRelationshipId = "rId6";
const resumeProjectIconRelationshipId = "rId17";
const resumeProjectIconSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5 8C5 6.89543 5.89543 6 7 6H12.25C12.7804 6 13.2891 6.21071 13.6642 6.58579L15.3284 8.25H23C24.1046 8.25 25 9.14543 25 10.25V22C25 23.1046 24.1046 24 23 24H7C5.89543 24 5 23.1046 5 22V8ZM7 8V22H23V10.25H14.5L12.25 8H7Z" fill="#373737"/>
<path d="M8.5 14.5H21.5" stroke="#373737" stroke-width="1.55" stroke-linecap="square"/>
<path d="M8.5 18H18.5" stroke="#373737" stroke-width="1.55" stroke-linecap="square"/>
</svg>`;
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
  const template = readFileSync(templatePath);
  const zip = new PizZip(template);
  applyResumePhoto(zip, {
    showPhoto: model.profile.showPhoto,
    photoAsset
  });
  applyResumeTemplateFixes(zip);
  const templateData = buildResumeDocxTemplateData(model);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => ""
  });

  doc.render(templateData);
  removeEmptyRenderedSectionHeadings(doc.getZip(), templateData);

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
}

export function getResumeDocxFilename({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const name = sanitizeFilename(model.profile.name || version.title || "resume");
  const target = sanitizeFilename(version.target_role || version.title || "简历");
  return `${name}-${target}.docx`;
}

function buildResumeDocxTemplateData(model: ResumeTemplateModel): ResumeDocxTemplateData {
  const sectionMap = new Map(model.sections.map((section) => [section.key, section]));
  const extraSectionKeys = model.sections.filter((section) => !["education", "experience", "projects", "campus", "skills"].includes(section.key));

  return {
    name: model.profile.name || "简历",
    genderRow: formatContactItem("性别", model.profile.gender),
    ageRow: formatContactItem("年龄", model.profile.age),
    phoneRow: formatContactItem("电话", model.profile.phone),
    emailRow: formatContactItem("邮箱", model.profile.email),
    contactLine: buildContactLine(model.profile),
    education: (sectionMap.get("education")?.entries ?? []).map((entry) => buildEntryData(entry)),
    experience: (sectionMap.get("experience")?.entries ?? []).map((entry) => buildEntryData(entry)),
    projects: (sectionMap.get("projects")?.entries ?? []).map((entry) => buildEntryData(entry)),
    campus: (sectionMap.get("campus")?.entries ?? []).map((entry) => buildEntryData(entry)),
    skills: (sectionMap.get("skills")?.entries ?? []).map((entry) => buildSkillEntryData(entry)),
    extraSections: extraSectionKeys.map((section) => ({
      label: section.label,
      entries: section.entries.map((entry) => buildEntryData(entry))
    }))
  };
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
  if (!showPhoto) {
    removeResumePhotoPlaceholder(zip);
    return;
  }

  if (!photoAsset) {
    return;
  }

  const mediaTarget = `media/resume-photo.${photoAsset.extension}`;
  zip.file(`word/${mediaTarget}`, photoAsset.buffer);
  updateResumePhotoRelationship(zip, mediaTarget);
  ensureImageContentType(zip, photoAsset.extension, photoAsset.mimeType);
}

function applyResumeTemplateFixes(zip: PizZip) {
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    return;
  }

  const documentXml = documentFile.asText();
  const withProjectSection = insertProjectSection(documentXml);
  const withConsistentEmail = replaceParagraphContaining(withProjectSection, "{emailRow}", normalizeEmailRowParagraph);
  const withBoldExperienceRole = replaceSectionBlock(withConsistentEmail, "{#experience}", "{/experience}", (sectionXml) => replaceFirstRunContaining(sectionXml, "{subtitle}", addBoldRunProperty));
  const withBoldProjectRole = replaceSectionBlock(withBoldExperienceRole, "{#projects}", "{/projects}", (sectionXml) => replaceFirstRunContaining(sectionXml, "{subtitle}", addBoldRunProperty));
  const withBoldCampusRole = replaceSectionBlock(withBoldProjectRole, "{#campus}", "{/campus}", (sectionXml) => replaceFirstRunContaining(sectionXml, "{subtitle}", addBoldRunProperty));
  const withSkillsBulletTypography = replaceSectionBlock(withBoldCampusRole, "{#skills}", "{/skills}", normalizeSkillsBulletParagraphs);

  zip.file("word/document.xml", withSkillsBulletTypography);
  ensureProjectIcon(zip);
}

function insertProjectSection(documentXml: string) {
  if (documentXml.includes("{#projects}")) {
    return documentXml;
  }

  const experienceBlock = getSectionTemplateBlock(documentXml, "{#experience}", "{/experience}");
  const campusBlock = getSectionTemplateBlock(documentXml, "{#campus}", "{/campus}");

  if (!experienceBlock || !campusBlock) {
    return documentXml;
  }

  const projectBlock = experienceBlock.xml
    .replaceAll("实习经历", "项目经历")
    .replaceAll("{#experience}", "{#projects}")
    .replaceAll("{/experience}", "{/projects}")
    .replaceAll('r:embed="rId9"', `r:embed="${resumeProjectIconRelationshipId}"`)
    .replaceAll('r:embed="rId10"', `r:embed="${resumeProjectIconRelationshipId}"`)
    .replace(/(<pic:cNvPr id="0" name=")[^"]+(" descr="icon\.png"\/>)/, "$1Project icon$2");

  return `${documentXml.slice(0, campusBlock.start)}${projectBlock}${documentXml.slice(campusBlock.start)}`;
}

function getSectionTemplateBlock(documentXml: string, startToken: string, endToken: string) {
  const startTokenIndex = documentXml.indexOf(startToken);

  if (startTokenIndex === -1) {
    return null;
  }

  const start = documentXml.lastIndexOf("<w:tbl>", startTokenIndex);
  const endTokenIndex = documentXml.indexOf(endToken, startTokenIndex);

  if (start === -1 || endTokenIndex === -1) {
    return null;
  }

  const endParagraphIndex = documentXml.indexOf("</w:p>", endTokenIndex);

  if (endParagraphIndex === -1) {
    return null;
  }

  const end = endParagraphIndex + "</w:p>".length;

  return {
    start,
    end,
    xml: documentXml.slice(start, end)
  };
}

function ensureProjectIcon(zip: PizZip) {
  zip.file("word/media/resume-project-icon.svg", resumeProjectIconSvg);
  ensureProjectIconRelationship(zip);
}

function ensureProjectIconRelationship(zip: PizZip) {
  const relsFile = zip.file("word/_rels/document.xml.rels");

  if (!relsFile) {
    return;
  }

  const relsXml = relsFile.asText();

  if (relsXml.includes(`Id="${resumeProjectIconRelationshipId}"`)) {
    return;
  }

  zip.file(
    "word/_rels/document.xml.rels",
    relsXml.replace("</Relationships>", `<Relationship Id="${resumeProjectIconRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/resume-project-icon.svg"/></Relationships>`)
  );
}

function removeEmptyRenderedSectionHeadings(zip: PizZip, data: ResumeDocxTemplateData) {
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    return;
  }

  let documentXml = documentFile.asText();
  const fixedSections: Array<[string, unknown[]]> = [
    ["教育经历", data.education],
    ["实习经历", data.experience],
    ["项目经历", data.projects],
    ["在校经历", data.campus],
    ["相关技能", data.skills]
  ];

  for (const [label, entries] of fixedSections) {
    if (entries.length === 0) {
      documentXml = removeSectionHeadingTable(documentXml, label);
    }
  }

  zip.file("word/document.xml", documentXml);
}

function removeSectionHeadingTable(documentXml: string, label: string) {
  const labelIndex = documentXml.indexOf(label);

  if (labelIndex === -1) {
    return documentXml;
  }

  const start = documentXml.lastIndexOf("<w:tbl>", labelIndex);
  const endIndex = documentXml.indexOf("</w:tbl>", labelIndex);

  if (start === -1 || endIndex === -1) {
    return documentXml;
  }

  return `${documentXml.slice(0, start)}${documentXml.slice(endIndex + "</w:tbl>".length)}`;
}

function normalizeEmailRowParagraph(paragraphXml: string) {
  const paragraphProperties =
    '<w:pPr><w:adjustRightInd w:val="0"/><w:snapToGrid w:val="0"/><w:spacing w:after="0" w:line="377" w:lineRule="exact"/><w:textAlignment w:val="center"/><w:rPr><w:rFonts w:ascii="微软雅黑" w:eastAsia="微软雅黑" w:hAnsi="微软雅黑" w:cs="微软雅黑"/></w:rPr></w:pPr>';
  const runProperties = '<w:rPr><w:rFonts w:ascii="微软雅黑" w:eastAsia="微软雅黑" w:hAnsi="微软雅黑" w:cs="微软雅黑"/><w:b/><w:color w:val="373737"/><w:sz w:val="20"/></w:rPr>';
  const emailRun = `<w:r>${runProperties}<w:t xml:space="preserve">{emailRow}</w:t></w:r>`;

  return paragraphXml
    .replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, paragraphProperties)
    .replace(runContainingPattern("{emailRow}"), emailRun);
}

function replaceParagraphContaining(xml: string, token: string, replacer: (paragraphXml: string) => string) {
  const paragraphPattern = new RegExp(`<w:p\\b(?:(?!</w:p>)[\\s\\S])*?${escapeRegExp(token)}(?:(?!</w:p>)[\\s\\S])*?</w:p>`);
  return xml.replace(paragraphPattern, (paragraphXml) => replacer(paragraphXml));
}

function replaceSectionBlock(xml: string, startToken: string, endToken: string, replacer: (sectionXml: string) => string) {
  const startIndex = xml.indexOf(startToken);

  if (startIndex === -1) {
    return xml;
  }

  const endIndex = xml.indexOf(endToken, startIndex);

  if (endIndex === -1) {
    return xml;
  }

  return `${xml.slice(0, startIndex)}${replacer(xml.slice(startIndex, endIndex))}${xml.slice(endIndex)}`;
}

function replaceFirstRunContaining(xml: string, token: string, replacer: (runXml: string) => string) {
  return xml.replace(runContainingPattern(token), (runXml) => replacer(runXml));
}

function runContainingPattern(token: string) {
  return new RegExp(`<w:r\\b[^>]*>(?:(?!</w:r>)[\\s\\S])*?${escapeRegExp(token)}(?:(?!</w:r>)[\\s\\S])*?</w:r>`);
}

function addBoldRunProperty(runXml: string) {
  if (/<w:b\b/.test(runXml)) {
    return runXml;
  }

  if (runXml.includes("<w:rPr>")) {
    return runXml.replace(/(<w:rPr><w:rFonts\b[^>]*\/>)/, "$1<w:b/>").replace(/<w:rPr>(?![\s\S]*?<w:b\b)/, "<w:rPr><w:b/>");
  }

  return runXml.replace(/(<w:r\b[^>]*>)/, "$1<w:rPr><w:b/></w:rPr>");
}

function normalizeSkillsBulletParagraphs(sectionXml: string) {
  return sectionXml.replace(/<w:p\b(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/g, (paragraphXml) => {
    if (!paragraphXml.includes("<w:numPr>")) {
      return paragraphXml;
    }

    return normalizeParagraphMarkRunProperties(paragraphXml);
  });
}

function normalizeParagraphMarkRunProperties(paragraphXml: string) {
  return paragraphXml.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, (paragraphPropertiesXml) => {
    if (!paragraphPropertiesXml.includes("<w:rPr>")) {
      return paragraphPropertiesXml.replace("</w:pPr>", `<w:rPr>${resumeBodyFontRunProperties()}</w:rPr></w:pPr>`);
    }

    return paragraphPropertiesXml.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/, (_runPropertiesXml, runPropertiesBody: string) => {
      let normalized = runPropertiesBody;

      if (!/<w:rFonts\b/.test(normalized)) {
        normalized = `${resumeBodyFontRunFonts()}${normalized}`;
      }

      if (!/<w:sz\b/.test(normalized)) {
        normalized = `${normalized}<w:sz w:val="20"/>`;
      }

      return `<w:rPr>${normalized}</w:rPr>`;
    });
  });
}

function resumeBodyFontRunProperties() {
  return `${resumeBodyFontRunFonts()}<w:color w:val="000000" w:themeColor="text1"/><w:sz w:val="20"/>`;
}

function resumeBodyFontRunFonts() {
  return '<w:rFonts w:ascii="微软雅黑" w:eastAsia="微软雅黑" w:hAnsi="微软雅黑" w:cs="微软雅黑"/>';
}

function removeResumePhotoPlaceholder(zip: PizZip) {
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    return;
  }

  const documentXml = documentFile.asText();
  const photoParagraphPattern = new RegExp(`<w:p\\b(?:(?!</w:p>)[\\s\\S])*?r:embed="${escapeRegExp(resumePhotoRelationshipId)}"(?:(?!</w:p>)[\\s\\S])*?</w:p>`);
  const withoutPhoto = documentXml.replace(photoParagraphPattern, "");
  const expandedHeader = withoutPhoto.replace(
    '<w:tblW w:w="8053" w:type="dxa"/><w:tblInd w:w="2648" w:type="dxa"/>',
    '<w:tblW w:w="10740" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/>'
  );
  zip.file("word/document.xml", expandedHeader);
}

function updateResumePhotoRelationship(zip: PizZip, mediaTarget: string) {
  const relsFile = zip.file("word/_rels/document.xml.rels");

  if (!relsFile) {
    return;
  }

  const relsXml = relsFile.asText();
  const relationshipPattern = new RegExp(`(<Relationship\\b(?=[^>]*\\bId="${escapeRegExp(resumePhotoRelationshipId)}")[^>]*\\bTarget=")[^"]+(")`);
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

function buildEntryData(entry: ResumeTemplateEntry) {
  return {
    date: entry.date || "",
    title: entry.title || "",
    subtitle: entry.subtitle || "",
    summary: entry.summary || "",
    detailLines: entry.detailLines.filter(Boolean),
    bullets: entry.bullets.filter(Boolean).map(splitBulletText),
    tokenLines: entry.tokens ? [entry.tokens] : []
  };
}

function buildSkillEntryData(entry: ResumeTemplateEntry): ResumeDocxTemplateSkillEntry {
  const content = [entry.subtitle, entry.summary, ...entry.detailLines, entry.tokens ? `工具 / 方法：${entry.tokens}` : ""].filter(Boolean).join("；");

  return {
    label: entry.title ? `${entry.title}：` : "",
    text: content,
    bullets: entry.bullets.filter(Boolean).map(splitBulletText)
  };
}

function buildContactLine(data: ResumeTemplateModel["profile"]) {
  return [
    data.headline,
    formatContactItem("所在地", data.location),
    formatContactItem("链接", data.website),
    formatContactItem("社交", data.socialLinks)
  ].filter(Boolean).join("    ");
}

function formatContactItem(label: string, value?: string | null) {
  return value ? `${label}：${value}` : "";
}

function splitBulletText(value: string): ResumeDocxBullet {
  const cleaned = value.trim().replace(/^[•·\\-]\\s*/, "");
  const match = cleaned.match(/^(.{2,28}?[：:])\\s*(.+)$/);

  if (!match) {
    return { label: "", text: cleaned };
  }

  return {
    label: match[1],
    text: match[2]
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
