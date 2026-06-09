import type { Visibility } from "./types";

export type ProjectStatus = "planning" | "in_progress" | "completed" | "archived";
export type SkillStatus = "idea" | "developing" | "testing" | "available" | "archived";
export type PublicationType = "research_report" | "academic_paper" | "strategy_report" | "market_analysis" | "data_analysis" | "meeting_notes" | "reading_review" | "other";
export type DocumentCategory = "research_material" | "publication_attachment" | "data_file" | "final_report" | "meeting_material" | "skill_attachment" | "other";
export type DocumentRelatedType = "publication" | "project" | "skill";
export type AccessRequestStatus = "pending" | "approved" | "rejected";
export type AccessRequestContentType = "project" | "publication" | "skill" | "knowledge" | "other";
export type AccessGrantStatus = "active" | "revoked";
export type AccessGrantContentType = "project" | "publication" | "skill" | "knowledge";
export type CalendarEventType = "general" | "meeting" | "research" | "deadline" | "review" | "reminder";
export type ResumeItemType = "basic" | "education" | "experience" | "project" | "research" | "skill" | "certification" | "award" | "language" | "other";

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

export type PublicationRecord = {
  id: string;
  slug: string;
  title: string;
  publication_type: PublicationType;
  summary: string;
  abstract: string | null;
  published_on: string | null;
  tags: string[];
  cover_url: string | null;
  file_path: string | null;
  is_featured: boolean;
  project_id: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  projects?: Pick<ProjectRecord, "id" | "title" | "slug"> | null;
};

export type DocumentRecord = {
  id: string;
  name: string;
  category: DocumentCategory;
  storage_bucket: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  related_type: DocumentRelatedType | null;
  related_id: string | null;
  visibility: Visibility;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentWithRelation = DocumentRecord & {
  related?: {
    type: DocumentRelatedType;
    title: string;
    href: string;
  } | null;
};

export type ActivityLogRecord = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CalendarEventRecord = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  event_type: CalendarEventType;
  project_id: string | null;
  publication_id: string | null;
  knowledge_note_id: string | null;
  skill_id: string | null;
  visibility: "public" | "private";
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  projects?: Pick<ProjectRecord, "id" | "title" | "slug"> | null;
  publications?: Pick<PublicationRecord, "id" | "title" | "slug"> | null;
  knowledge_notes?: Pick<KnowledgeNoteRecord, "id" | "title" | "slug"> | null;
  skills?: Pick<SkillRecord, "id" | "name" | "slug"> | null;
};

export type ResumeItemRecord = {
  id: string;
  item_type: ResumeItemType;
  title: string;
  organization: string | null;
  role_title: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  summary: string | null;
  bullets: string[];
  skills: string[];
  tags: string[];
  sort_order: number;
  visibility: "public" | "private";
  is_featured: boolean;
  related_project_id: string | null;
  related_publication_id: string | null;
  related_knowledge_id: string | null;
  related_skill_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessRequestRecord = {
  id: string;
  requester_name: string;
  requester_email: string;
  organization: string | null;
  requested_content_type: AccessRequestContentType | null;
  requested_content_title: string | null;
  requested_content_url: string | null;
  reason: string;
  status: AccessRequestStatus;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentAccessGrantRecord = {
  id: string;
  grantee_email: string;
  content_type: AccessGrantContentType;
  content_id: string;
  status: AccessGrantStatus;
  expires_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentAccessGrantWithTarget = ContentAccessGrantRecord & {
  target?: {
    title: string;
    href: string;
    visibility: Visibility;
  } | null;
};

export type ProfileRecord = {
  id: string;
  display_name: string;
  email: string | null;
  headline: string | null;
  bio: string | null;
  education: string | null;
  role_title: string | null;
  organization: string | null;
  location: string | null;
  research_interests: string[];
  skill_tags: string[];
  contact: Record<string, string>;
  social_links: Record<string, string>;
  avatar_url: string | null;
  resume_url: string | null;
  is_public: boolean;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};
