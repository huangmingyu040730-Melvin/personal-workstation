import type { Visibility } from "./types";

export type ProjectStatus = "planning" | "in_progress" | "completed" | "archived";
export type SkillStatus = "idea" | "developing" | "testing" | "available" | "archived";

export type ProjectRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  background: string | null;
  research_question: string | null;
  methodology: string | null;
  status: ProjectStatus;
  progress: number;
  is_featured: boolean;
  start_date: string | null;
  tags: string[];
  milestones: string[];
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type KnowledgeNoteRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  content: string | null;
  tags: string[];
  is_featured: boolean;
  project_id: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  projects?: Pick<ProjectRecord, "id" | "title" | "slug"> | null;
};

export type SkillRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  content: string | null;
  category: string;
  platforms: string[];
  status: SkillStatus;
  current_version: string | null;
  input_description: string | null;
  output_description: string | null;
  usage_guide: string | null;
  skill_md_content: string | null;
  repository_url: string | null;
  is_featured: boolean;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type SkillVersionRecord = {
  id: string;
  skill_id: string;
  version: string;
  notes: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLogRecord = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
