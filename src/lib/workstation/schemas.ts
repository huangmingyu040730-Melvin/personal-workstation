import { z } from "zod";
import type { ProjectStatus, SkillStatus } from "@/lib/content-types";
import { knowledgeSchema } from "@/lib/validations/knowledge";
import { projectSchema } from "@/lib/validations/project";
import { skillSchema } from "@/lib/validations/skill";
import { optionalText, slugSchema, textArraySchema } from "@/lib/validations/common";

const privateVisibilitySchema = z
  .enum(["private", "public", "unlisted"])
  .optional()
  .refine((value) => value === undefined || value === "private", {
    message: "Workstation API can only create private records."
  });

const projectStatusValueSchema = z
  .enum(["planning", "in_progress", "active", "completed", "archived"])
  .transform((status): ProjectStatus => (status === "active" ? "in_progress" : status));

const projectStatusSchema = projectStatusValueSchema
  .default("planning")
  .transform((status): ProjectStatus => status);

const skillStatusValueSchema = z
  .enum(["idea", "developing", "testing", "available", "archived"])
  .transform((status): SkillStatus => status);

const skillStatusSchema = skillStatusValueSchema
  .default("idea")
  .transform((status): SkillStatus => status);

const updateTextArraySchema = z.array(z.string().trim().min(1));

function requireAtLeastOneUpdateField<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.refine((value) => Object.keys(value).length > 0, {
    message: "At least one update field is required."
  });
}

export const workstationProjectCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  slug: slugSchema,
  summary: z.string().trim().min(1, "Summary is required").max(500, "Summary is too long"),
  status: projectStatusSchema,
  tags: textArraySchema,
  background: optionalText(),
  research_question: optionalText(),
  methodology: optionalText(),
  visibility: privateVisibilitySchema
}).strict();

export const workstationKnowledgeCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(140, "Title is too long"),
  slug: slugSchema,
  category: z.string().trim().min(1, "Category is required").max(80, "Category is too long"),
  excerpt: optionalText(),
  content: optionalText(),
  tags: textArraySchema,
  project_id: optionalText(),
  visibility: privateVisibilitySchema
}).strict();

export const workstationSkillCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  slug: slugSchema,
  description: z.string().trim().min(1, "Description is required").max(500, "Description is too long"),
  category: z.string().trim().min(1, "Category is required"),
  platforms: textArraySchema,
  status: skillStatusSchema,
  content: optionalText(),
  usage: optionalText(),
  usage_guide: optionalText(),
  input_description: optionalText(),
  output_description: optionalText(),
  current_version: optionalText(),
  repository_url: optionalText(),
  visibility: privateVisibilitySchema
}).strict();

export const workstationProjectUpdateSchema = requireAtLeastOneUpdateField(z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long").optional(),
  summary: z.string().trim().min(1, "Summary is required").max(500, "Summary is too long").optional(),
  status: projectStatusValueSchema.optional(),
  tags: updateTextArraySchema.optional(),
  background: optionalText().optional(),
  research_question: optionalText().optional(),
  methodology: optionalText().optional()
}).strict());

export const workstationKnowledgeUpdateSchema = requireAtLeastOneUpdateField(z.object({
  title: z.string().trim().min(1, "Title is required").max(140, "Title is too long").optional(),
  category: z.string().trim().min(1, "Category is required").max(80, "Category is too long").optional(),
  excerpt: optionalText().optional(),
  content: optionalText().optional(),
  tags: updateTextArraySchema.optional(),
  project_id: optionalText().optional()
}).strict());

export const workstationSkillUpdateSchema = requireAtLeastOneUpdateField(z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long").optional(),
  description: z.string().trim().min(1, "Description is required").max(500, "Description is too long").optional(),
  category: z.string().trim().min(1, "Category is required").optional(),
  platforms: updateTextArraySchema.optional(),
  status: skillStatusValueSchema.optional(),
  content: optionalText().optional(),
  usage_guide: optionalText().optional(),
  input_description: optionalText().optional(),
  output_description: optionalText().optional(),
  current_version: optionalText().optional(),
  repository_url: optionalText().optional()
}).strict());

export type WorkstationProjectCreateInput = z.infer<typeof workstationProjectCreateSchema>;
export type WorkstationKnowledgeCreateInput = z.infer<typeof workstationKnowledgeCreateSchema>;
export type WorkstationSkillCreateInput = z.infer<typeof workstationSkillCreateSchema>;
export type WorkstationProjectUpdateInput = z.infer<typeof workstationProjectUpdateSchema>;
export type WorkstationKnowledgeUpdateInput = z.infer<typeof workstationKnowledgeUpdateSchema>;
export type WorkstationSkillUpdateInput = z.infer<typeof workstationSkillUpdateSchema>;

export function toProjectPayload(input: WorkstationProjectCreateInput) {
  return projectSchema.safeParse({
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    background: input.background,
    research_question: input.research_question,
    methodology: input.methodology,
    status: input.status,
    progress: 0,
    tags: input.tags,
    milestones: [],
    start_date: null,
    is_featured: false,
    visibility: "private"
  });
}

export function toKnowledgePayload(input: WorkstationKnowledgeCreateInput) {
  return knowledgeSchema.safeParse({
    title: input.title,
    slug: input.slug,
    category: input.category,
    excerpt: input.excerpt,
    content: input.content,
    tags: input.tags,
    project_id: input.project_id,
    is_featured: false,
    visibility: "private"
  });
}

export function toSkillPayload(input: WorkstationSkillCreateInput) {
  return skillSchema.safeParse({
    name: input.name,
    slug: input.slug,
    description: input.description,
    content: input.content,
    category: input.category,
    platforms: input.platforms.length > 0 ? input.platforms : ["codex"],
    status: input.status,
    current_version: input.current_version,
    input_description: input.input_description,
    output_description: input.output_description,
    usage_guide: input.usage_guide ?? input.usage,
    skill_md_content: null,
    repository_url: input.repository_url,
    is_featured: false,
    visibility: "private",
    create_initial_version: false,
    version_notes: null,
    version_released_at: null
  });
}
