import type { Visibility } from "./types";

export type ProjectStatus = "planning" | "in_progress" | "completed" | "archived";
export type SkillStatus = "idea" | "developing" | "testing" | "available" | "archived";
export type PublicationType = "research_report" | "academic_paper" | "strategy_report" | "market_analysis" | "data_analysis" | "meeting_notes" | "reading_review" | "other";
export type DocumentCategory = "research_material" | "publication_attachment" | "data_file" | "final_report" | "meeting_material" | "skill_attachment" | "other";
export type DocumentRelatedType = "publication" | "project" | "skill" | "knowledge";
export type DocumentAssetRelationType = "related" | "source_material" | "supporting_material" | "deliverable" | "reference" | "input" | "output";
export type DocumentCollectionType = "folder_upload" | "attachment_bundle" | "skill_package" | "general_batch";
export type ResearchAssetType = "project" | "knowledge" | "skill" | "publication";
export type ResearchAssetRelationType = "related" | "supports" | "references" | "uses" | "produces" | "derived_from";
export type CalendarEventType = "general" | "meeting" | "research" | "deadline" | "review" | "reminder";
export type ResumeItemType = "basic" | "education" | "experience" | "project" | "research" | "skill" | "certification" | "award" | "language" | "other";
export type ResumeVersionLanguage = "zh" | "en";
export type ResumeTemplateKey = "classic" | "compact" | "research";
export type ResumeSectionKey = "summary" | "education" | "experience" | "projects" | "research" | "skills" | "certifications" | "awards" | "other";
export type ResumeJdReviewStatus = "draft" | "reviewed" | "ready" | "submitted" | "interview" | "rejected" | "offer" | "archived";

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
  collection_id: string | null;
  original_name: string | null;
  relative_path: string | null;
  folder_path: string | null;
  related_type: DocumentRelatedType | null;
  related_id: string | null;
  visibility: Visibility;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentCollectionRecord = {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  collection_type: DocumentCollectionType;
  related_type: DocumentRelatedType | null;
  related_id: string | null;
  root_folder_name: string | null;
  file_count: number;
  total_size: number;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type DocumentAssetLinkSummary = {
  id: string;
  asset_type: DocumentRelatedType;
  asset_id: string;
  relation_type: DocumentAssetRelationType;
  relation_label: string;
  title: string;
  href: string;
  note: string | null;
};

export type DocumentWithRelation = DocumentRecord & {
  related?: {
    type: DocumentRelatedType;
    title: string;
    href: string;
  } | null;
  relations: DocumentAssetLinkSummary[];
  collection?: Pick<DocumentCollectionRecord, "id" | "title" | "collection_type" | "root_folder_name" | "file_count" | "total_size"> | null;
};

export type DocumentCollectionWithRelation = DocumentCollectionRecord & {
  related?: {
    type: DocumentRelatedType;
    title: string;
    href: string;
  } | null;
  relations: DocumentAssetLinkSummary[];
};

export type ResearchAssetLinkRecord = {
  id: string;
  source_type: ResearchAssetType;
  source_id: string;
  target_type: ResearchAssetType;
  target_id: string;
  relation_type: ResearchAssetRelationType;
  note: string | null;
  created_by: string | null;
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
  details: Record<string, unknown>;
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

export type ResumeVersionRecord = {
  id: string;
  title: string;
  target_role: string | null;
  summary: string | null;
  language: ResumeVersionLanguage;
  template_key: ResumeTemplateKey;
  visibility: "public" | "private";
  is_active: boolean;
  is_featured: boolean;
  notes: string | null;
  profile_fields: Record<string, unknown>;
  section_order: string[];
  template_options: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ResumeVersionItemRecord = {
  id: string;
  resume_version_id: string;
  resume_item_id: string;
  section_key: ResumeSectionKey;
  sort_order: number;
  is_visible: boolean;
  note: string | null;
  visible_fields: Record<string, unknown>;
  created_at: string;
  resume_items?: ResumeItemRecord | null;
};

export type ResumeVersionWithItems = ResumeVersionRecord & {
  resume_version_items: ResumeVersionItemRecord[];
};

export type ResumeJdReviewRecord = {
  id: string;
  owner_id: string;
  resume_version_id: string;
  company_name: string | null;
  job_title: string | null;
  job_direction: string | null;
  job_location: string | null;
  application_channel: string | null;
  jd_text: string;
  target_keywords: string[];
  ai_result: Record<string, unknown>;
  match_summary: string | null;
  missing_keywords: string[];
  matched_keywords: string[];
  risks: string[];
  next_actions: string[];
  application_status: ResumeJdReviewStatus;
  notes: string | null;
  model_name: string | null;
  created_at: string;
  updated_at: string;
  resume_versions?: Pick<ResumeVersionRecord, "id" | "title" | "target_role"> | null;
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
