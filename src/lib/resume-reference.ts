import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { detailRecord, getResumeProfileData, stringDetail } from "@/lib/resume-display";
import { buildResumeTemplateModel, normalizeProfileFields, type ResumeTemplateEntry } from "@/lib/resume-template-model";

export const referenceResumeRevision = "word-20260920-exact-v1";
export const referenceResumeTemplatePath = path.join(process.cwd(), "src/templates/resume/20261018-reference-template.docx");
type ReferenceParagraph = { key: string; role: string; texts: string[] };
type ReferenceMetadata = {
  revision: string;
  pattern: string;
  paragraphs: ReferenceParagraph[];
  dates?: { start_date: string | null; end_date: string | null; is_current: boolean; text: string };
  profile?: { name: string; phone: string; email: string };
  skill?: { title: string; summary: string };
  reference_snapshot_hash?: string;
  pdf_data_url?: string;
  preview_data_url?: string;
};
type Pattern = { rows: number[]; paragraphs: Array<{ key: string; role: string }> };
type Layout = {
  revision: string;
  paragraphs: Record<string, { slots: string[] }>;
  headings: Record<string, { row: number; values: Record<string, string> }>;
  patterns: Record<string, Pattern>;
};
type ReferenceInput = { version: ResumeVersionWithItems; profile: ProfileRecord; basicItem: ResumeItemRecord | null };
const rowPattern = /<w:tr\b[\s\S]*?<\/w:tr>/g;
const paragraphPattern = /<w:p\b[\s\S]*?<\/w:p>/g;

export function isReferenceResume(version: ResumeVersionWithItems) {
  return version.template_options?.reference_revision === referenceResumeRevision;
}

function metadata(item: ResumeItemRecord | null | undefined): ReferenceMetadata | null {
  const raw = item?.details?._resume_source;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as ReferenceMetadata;
  return value.revision === referenceResumeRevision && Array.isArray(value.paragraphs) ? value : null;
}

function escapeXml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Clone the source paragraph and run properties, rather than putting new text
// into an arbitrary punctuation run. This also works without private source metadata.
function styledParagraph(prototype: string, text: string, { plain = false, label = "", regular = false } = {}) {
  const start = prototype.match(/^<w:p\b[^>]*>/)![0];
  let properties = prototype.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)?.[0] || "";
  if (plain) properties = properties.replace(/<w:numPr\b[\s\S]*?<\/w:numPr>/g, "");
  const runs = (prototype.match(/<w:r\b[\s\S]*?<\/w:r>/g) || []).filter((run) => /<w:t\b/.test(run));
  const first = runs[0] || "<w:r></w:r>";
  const regularRun = runs.find((run) => !/<w:b(?:\s[^>]*|\/)?>/.test(run)) || first;
  const makeRun = (run: string, value: string) => {
    const style = run.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0] || "";
    const content = value.split(/\r?\n/).map((line) => `<w:t xml:space="preserve">${escapeXml(line)}</w:t>`).join("<w:br/>");
    return `<w:r>${style}${content}</w:r>`;
  };
  return `${start}${properties}${label ? makeRun(first, label) : ""}${makeRun(label || plain || regular ? regularRun : first, text)}</w:p>`;
}

function labeledParagraph(prototype: string, text: string, plain = false) {
  const match = text.match(/^(.{1,28}?[：:])\s*([\s\S]+)$/);
  return match ? styledParagraph(prototype, match[2], { plain, label: match[1] }) : styledParagraph(prototype, text, { plain, regular: true });
}

function completeCells(xml: string) {
  return xml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) => /<w:p\b/.test(cell) ? cell : cell.replace("</w:tc>", "<w:p/></w:tc>"));
}

function keepWithNext(paragraph: string) {
  if (/<w:keepNext\b/.test(paragraph)) return paragraph;
  return paragraph.includes("<w:pPr>") ? paragraph.replace("<w:pPr>", "<w:pPr><w:keepNext/>") : paragraph.replace(/^(<w:p\b[^>]*>)/, "$1<w:pPr><w:keepNext/></w:pPr>");
}

// Preserve unchanged run boundaries exactly. For edited text, retain styles on
// the unchanged prefix/suffix and put the replacement in the affected run.
export function redistributeReferenceText(original: string[], replacement: string): string[] {
  const before = original.join("");
  if (before.trim() === replacement.trim()) return original;
  let prefix = 0;
  while (prefix < before.length && prefix < replacement.length && before[prefix] === replacement[prefix]) prefix++;
  let suffix = 0;
  while (suffix < before.length - prefix && suffix < replacement.length - prefix && before[before.length - 1 - suffix] === replacement[replacement.length - 1 - suffix]) suffix++;
  let offset = 0;
  let inserted = false;
  const middle = replacement.slice(prefix, replacement.length - suffix);
  const result = original.map((value, i) => {
    const start = offset;
    const end = start + value.length;
    offset = end;
    const left = value.slice(0, Math.max(0, Math.min(value.length, prefix - start)));
    const rightStart = Math.max(0, before.length - suffix - start);
    const right = rightStart < value.length ? value.slice(rightStart) : "";
    const receives = !inserted && (end > prefix || i === original.length - 1);
    if (receives) inserted = true;
    return left + (receives ? middle : "") + right;
  });
  return result;
}

function semanticText(role: string, item: ResumeItemRecord, link: ResumeVersionItemRecord, source: ReferenceMetadata | null) {
  const details = detailRecord(item);
  const visible = link.visible_fields ?? {};
  const shown = (key: string) => visible[key] !== false;
  if (role === "title") {
    const key = item.item_type === "education" ? "school" : item.item_type === "experience" ? "company" : "project_name";
    return shown(`show_${key}`) ? stringDetail(details, key) || item.organization || item.title : "";
  }
  if (role === "subtitle") {
    if (item.item_type === "education" && !shown("show_major") && !shown("show_degree")) return "";
    if (item.item_type === "experience" && !shown("show_position")) return "";
    if (item.item_type === "project" && !shown("show_project_role")) return "";
    return stringDetail(details, "resume_subtitle") || item.role_title || "";
  }
  if (role === "location") return shown("show_location") ? item.location || stringDetail(details, "location") : "";
  if (role === "summary") return shown("show_summary") ? item.summary || "" : "";
  if (role === "date") {
    if (!shown("show_date")) return "";
    const dates = source?.dates;
    if (dates && dates.start_date === item.start_date && dates.end_date === item.end_date && dates.is_current === item.is_current) return dates.text;
    const start = item.start_date?.slice(0, 7).replace("-", ".") || "";
    const end = item.is_current ? "至今" : item.end_date?.slice(0, 7).replace("-", ".") || "";
    return [start, end].filter(Boolean).join(" – ");
  }
  if (role === "skill") {
    const title = shown("show_skill_category") ? stringDetail(details, "skill_category") || item.title : "";
    const summary = shown("show_summary") ? item.summary || "" : "";
    if (source?.skill && title === source.skill.title && summary === source.skill.summary) return source.paragraphs[0]?.texts.join("") || "";
    return `${title ? `${title}: ` : ""}${summary}`;
  }
  if (role.startsWith("bullet:")) return shown("show_bullets") ? item.bullets[Number(role.split(":")[1])] || "" : "";
  return "";
}

export function renderReferenceDocument(templateXml: string, input: ReferenceInput): string {
  const layout: Layout = JSON.parse(readFileSync(path.join(process.cwd(), "src/templates/resume/20261018-reference-layout.json"), "utf8"));
  const rows = templateXml.match(rowPattern)!;
  const { version, basicItem } = input;
  const model = buildResumeTemplateModel(input);
  const links = new Map(version.resume_version_items.map((link) => [link.id, link]));
  function prototypeFor(key: string) {
    const slots = layout.paragraphs[key].slots;
    return templateXml.match(paragraphPattern)!.find((paragraph) => slots.some((slot) => paragraph.includes(slot)))!;
  }
  const bulletPrototype = prototypeFor(layout.patterns.experience0.paragraphs.find((part) => part.role === "bullet:0")!.key);
  function fillParagraph(xml: string, key: string, current: string, source: ReferenceMetadata | null) {
    const slots = layout.paragraphs[key]?.slots || [];
    const original = source?.paragraphs.find((p) => p.key === key)?.texts || slots.map(() => "");
    const sameBullet = current.replace(/^[•·\s]+/, "") === original.join("").trim().replace(/^[•·\s]+/, "");
    const texts = sameBullet ? original : redistributeReferenceText(original, current);
    return slots.reduce((value, slot, i) => value.replaceAll(slot, escapeXml(texts[i] || "")), xml);
  }
  function renderEntry(link: ResumeVersionItemRecord, key: string, entry: ResumeTemplateEntry) {
    const item = link.resume_items!;
    const source = metadata(item);
    const spec = layout.patterns[key];
    const lastBullet = [...spec.paragraphs].reverse().find((p) => p.role.startsWith("bullet:"));
    const lines = [entry.summary, ...entry.detailLines, entry.tokens ? `工具 / 方法：${entry.tokens}` : ""].filter(Boolean);
    let xml = spec.rows.map((row) => rows[row]).join("");
    xml = xml.replace(paragraphPattern, (paragraph) => {
      const part = spec.paragraphs.find((p) => layout.paragraphs[p.key].slots.some((slot) => paragraph.includes(slot)));
      if (!part) return paragraph;
      if (!source) {
        if (part.role === "summary") {
          return lines.map((line) => labeledParagraph(paragraph, line, true)).join("") + entry.bullets.map((line) => labeledParagraph(bulletPrototype, line)).join("");
        }
        if (part.role.startsWith("bullet:")) {
          if (part.role !== "bullet:0") return "";
          return lines.map((line) => labeledParagraph(paragraph, line, true)).join("") + entry.bullets.map((line, i) => {
            const part = spec.paragraphs.find((part) => part.role === `bullet:${i}`);
            return labeledParagraph(part ? prototypeFor(part.key) : paragraph, line);
          }).join("");
        }
        const value = entry[part.role as "title" | "subtitle" | "location" | "date"];
        return keepWithNext(styledParagraph(paragraph, value));
      }
      if (part.role.startsWith("bullet:")) {
        const index = Number(part.role.split(":")[1]);
        let rendered = index === 0 ? lines.map((line) => labeledParagraph(paragraph, line, true)).join("") : "";
        if (index >= item.bullets.length || link.visible_fields?.show_bullets === false) return rendered;
        rendered += fillParagraph(paragraph, part.key, semanticText(part.role, item, link, source), source);
        if (part === lastBullet) {
          for (let i = index + 1; i < item.bullets.length; i++) rendered += fillParagraph(paragraph, part.key, item.bullets[i], source);
        }
        return rendered;
      }
      const rendered = fillParagraph(paragraph, part.key, semanticText(part.role, item, link, source), source);
      return part.role === "summary" ? rendered + entry.detailLines.map((line) => labeledParagraph(paragraph, line, true)).join("") + entry.bullets.map((line) => labeledParagraph(bulletPrototype, line)).join("") : rendered;
    });
    // Source row minima describe the old sample's content length. New material
    // grows naturally, without inheriting blank sample space or clipping text.
    return completeCells(source ? xml : xml.replace(/<w:trHeight\b[^>]*\/>/g, ""));
  }
  const profile = getResumeProfileData({ profile: input.profile, basicItem, profileFields: normalizeProfileFields(version.profile_fields) });
  const basicSource = metadata(basicItem);
  const header = layout.patterns.header;
  let headerXml = rows[0];
  for (const part of header.paragraphs) {
    const original = basicSource?.paragraphs.find((p) => p.key === part.key)?.texts.join("") || "";
    let value = profile.name;
    if (part.role === "contact") {
      const previous = basicSource?.profile;
      value = previous && profile.phone && profile.email ? original.replace(previous.phone, profile.phone).replace(previous.email, profile.email) : [profile.phone ? `电话: ${profile.phone}` : "", profile.email ? `电子邮件: ${profile.email}` : ""].filter(Boolean).join(" | ");
    }
    const extraContacts = [profile.gender ? `性别: ${profile.gender}` : "", profile.age ? `年龄: ${profile.age}` : "", profile.headline, profile.location, profile.website, profile.socialLinks].filter(Boolean);
    if (part.role === "contact" && extraContacts.length) value = [value, ...extraContacts].filter(Boolean).join(" | ");
    headerXml = basicSource ? fillParagraph(headerXml, part.key, value, basicSource) : headerXml.replace(prototypeFor(part.key), styledParagraph(prototypeFor(part.key), value));
  }
  const output = [headerXml];
  for (const section of model.sections) {
    const heading = layout.headings[section.key] || layout.headings.experience;
    let headingXml = rows[heading.row];
    Object.entries(heading.values).forEach(([slot, value], i) => {
      headingXml = headingXml.replaceAll(slot, escapeXml(layout.headings[section.key] ? value : i === 0 ? section.label : ""));
    });
    if (section.entries.some((entry) => !metadata(links.get(entry.id)!.resume_items))) headingXml = headingXml.replace(paragraphPattern, keepWithNext);
    output.push(headingXml);
    if (section.key === "skills") {
      const row = rows[19];
      const start = row.indexOf("<w:p");
      const end = row.lastIndexOf("</w:p>") + "</w:p>".length;
      const paragraphs = section.entries.map((entry) => {
        const link = links.get(entry.id)!;
        const source = metadata(link.resume_items!);
        const key = source?.pattern.startsWith("skills") ? source.pattern : "skills0";
        const part = layout.patterns[key].paragraphs[0];
        const prototype = prototypeFor(part.key);
        const text = `${entry.title ? `${entry.title}: ` : ""}${entry.subtitle}`;
        const primary = source && entry.subtitle === (link.resume_items!.summary || "") ? fillParagraph(prototype, part.key, semanticText("skill", link.resume_items!, link, source), source) : labeledParagraph(prototype, text);
        return primary + entry.bullets.map((line) => labeledParagraph(prototype, line)).join("");
      });
      output.push(row.slice(0, start) + paragraphs.join("") + row.slice(end));
    } else {
      for (const entry of section.entries) {
        const link = links.get(entry.id)!;
        const source = metadata(link.resume_items!);
        const key = source && layout.patterns[source.pattern] && source.pattern.startsWith(section.key) ? source.pattern : section.key === "education" ? "education0" : section.key === "projects" ? "projects0" : "experience0";
        output.push(renderEntry(link, key, entry));
      }
    }
  }
  let index = 0;
  const result = templateXml.replace(rowPattern, () => index++ === 0 ? output.join("") : "");
  return result.replace(/__RESUME_SLOT_\d{4}__/g, "");
}

export function getReferenceContentHash(input: ReferenceInput, templateXml: string) {
  const xml = renderReferenceDocument(templateXml, input);
  const data = getResumeProfileData({ profile: input.profile, basicItem: input.basicItem, profileFields: normalizeProfileFields(input.version.profile_fields) });
  return createHash("sha256").update(xml).update(data.photoUrl).digest("hex");
}

export function getReferenceSnapshot(input: ReferenceInput, templateXml: string) {
  if (!isReferenceResume(input.version)) return null;
  const source = metadata(input.basicItem);
  const expected = input.version.template_options.reference_snapshot_hash || source?.reference_snapshot_hash;
  if (!source?.preview_data_url || !source.pdf_data_url || expected !== getReferenceContentHash(input, templateXml)) return null;
  if (!source.preview_data_url.startsWith("data:image/png;base64,") || !source.pdf_data_url.startsWith("data:application/pdf;base64,")) return null;
  return { image: source.preview_data_url, pdf: source.pdf_data_url };
}
