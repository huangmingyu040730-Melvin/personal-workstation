import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const weeklyReviewPeriod = "week" as const;

export type WeeklyReviewAttentionKind =
  | "stale_project"
  | "project_without_checkpoint"
  | "empty_collection"
  | "unfinished_skill"
  | "application_follow_up";

export type WeeklyReviewAttentionItem = {
  kind: WeeklyReviewAttentionKind;
  severity: "high" | "medium" | "low";
  entityType: "project" | "collection" | "skill" | "application";
  entityId: string;
  title: string;
  description: string;
  href: string;
  updatedAt: string;
};

export type WeeklyReview = {
  period: typeof weeklyReviewPeriod;
  generatedAt: string;
  window: {
    startsAt: string;
    endsAt: string;
    days: number;
  };
  thresholds: {
    staleProjectDays: number;
    unfinishedSkillDays: number;
    applicationFollowUpDays: number;
  };
  totals: {
    projects: number;
    activeProjects: number;
    knowledge: number;
    skills: number;
    collections: number;
    resumeVersions: number;
    applications: number;
  };
  thisWeek: {
    projectsUpdated: number;
    knowledgeUpdated: number;
    skillsUpdated: number;
    collectionsUpdated: number;
    applicationsUpdated: number;
  };
  health: {
    status: "healthy" | "watch" | "action_required";
    activeProjectsWithKnowledge: number;
    activeProjectsTotal: number;
    populatedCollections: number;
    collectionsTotal: number;
    availableSkills: number;
    skillsTotal: number;
  };
  careerStatusCounts: Record<string, number>;
  attention: WeeklyReviewAttentionItem[];
};

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

type KnowledgeRow = {
  id: string;
  project_id: string | null;
  updated_at: string;
};

type SkillRow = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
};

type CollectionRow = {
  id: string;
  title: string;
  file_count: number;
  updated_at: string;
};

type ResumeVersionRow = {
  id: string;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  company_name: string | null;
  job_title: string | null;
  application_status: string;
  updated_at: string;
};

type WeeklyReviewInput = {
  projects: ProjectRow[];
  knowledge: KnowledgeRow[];
  skills: SkillRow[];
  collections: CollectionRow[];
  resumeVersions: ResumeVersionRow[];
  applications: ApplicationRow[];
};

export type WeeklyReviewQueryResult =
  | { ok: true; data: WeeklyReview }
  | { ok: false; error: { code: "INTERNAL_ERROR"; message: string; status: number } };

const WEEK_DAYS = 7;
const STALE_PROJECT_DAYS = 14;
const UNFINISHED_SKILL_DAYS = 30;
const APPLICATION_FOLLOW_UP_DAYS = 7;
const ACTIVE_PROJECT_STATUSES = new Set(["planning", "in_progress"]);
const UNFINISHED_SKILL_STATUSES = new Set(["idea", "developing", "testing"]);
const OPEN_APPLICATION_STATUSES = new Set(["submitted", "interview"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function ageInDays(value: string, now: Date) {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.floor((now.getTime() - timestamp) / DAY_MS));
}

function updatedWithin(value: string, startsAt: Date) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp >= startsAt.getTime();
}

function checkpointHref(projectId: string) {
  const params = new URLSearchParams({ project_id: projectId, template: "project" });
  return `/dashboard/knowledge/new?${params.toString()}`;
}

function sortAttention(items: WeeklyReviewAttentionItem[]) {
  const severityOrder = { high: 0, medium: 1, low: 2 } as const;
  return [...items].sort((left, right) => (
    severityOrder[left.severity] - severityOrder[right.severity]
    || left.updatedAt.localeCompare(right.updatedAt)
    || left.title.localeCompare(right.title, "zh-CN")
  ));
}

export function buildWeeklyReview(input: WeeklyReviewInput, currentTime = new Date()): WeeklyReview {
  const endsAt = new Date(currentTime);
  const startsAt = new Date(endsAt.getTime() - WEEK_DAYS * DAY_MS);
  const activeProjects = input.projects.filter((project) => ACTIVE_PROJECT_STATUSES.has(project.status));
  const projectIdsWithKnowledge = new Set(input.knowledge.map((note) => note.project_id).filter(Boolean));
  const activeProjectsWithKnowledge = activeProjects.filter((project) => projectIdsWithKnowledge.has(project.id));
  const attention: WeeklyReviewAttentionItem[] = [];

  for (const project of activeProjects) {
    const projectAge = ageInDays(project.updated_at, endsAt);

    if (project.status === "in_progress" && projectAge >= STALE_PROJECT_DAYS) {
      attention.push({
        kind: "stale_project",
        severity: "high",
        entityType: "project",
        entityId: project.id,
        title: project.title,
        description: `进行中项目已 ${projectAge} 天未更新，请确认进度或状态。`,
        href: `/dashboard/projects/${project.id}`,
        updatedAt: project.updated_at
      });
    }

    if (!projectIdsWithKnowledge.has(project.id)) {
      attention.push({
        kind: "project_without_checkpoint",
        severity: "medium",
        entityType: "project",
        entityId: project.id,
        title: project.title,
        description: "当前活跃项目尚无关联知识笔记，可记录一次阶段结论。",
        href: checkpointHref(project.id),
        updatedAt: project.updated_at
      });
    }
  }

  for (const collection of input.collections) {
    if (collection.file_count === 0) {
      attention.push({
        kind: "empty_collection",
        severity: "low",
        entityType: "collection",
        entityId: collection.id,
        title: collection.title,
        description: "文档包当前为空，请补充文件或确认是否仍需保留。",
        href: `/dashboard/documents/collections/${collection.id}`,
        updatedAt: collection.updated_at
      });
    }
  }

  for (const skill of input.skills) {
    const skillAge = ageInDays(skill.updated_at, endsAt);

    if (UNFINISHED_SKILL_STATUSES.has(skill.status) && skillAge >= UNFINISHED_SKILL_DAYS) {
      attention.push({
        kind: "unfinished_skill",
        severity: "low",
        entityType: "skill",
        entityId: skill.id,
        title: skill.name,
        description: `${skill.status} 状态已持续至少 ${skillAge} 天，请确认继续开发或归档。`,
        href: `/dashboard/skills/${skill.id}`,
        updatedAt: skill.updated_at
      });
    }
  }

  for (const application of input.applications) {
    const applicationAge = ageInDays(application.updated_at, endsAt);

    if (OPEN_APPLICATION_STATUSES.has(application.application_status) && applicationAge >= APPLICATION_FOLLOW_UP_DAYS) {
      const label = [application.company_name, application.job_title].filter(Boolean).join(" · ") || "未命名求职记录";
      attention.push({
        kind: "application_follow_up",
        severity: application.application_status === "interview" ? "high" : "medium",
        entityType: "application",
        entityId: application.id,
        title: label,
        description: `${application.application_status} 状态已 ${applicationAge} 天未更新，请核对后续进展。`,
        href: `/dashboard/resume/jd-reviews/${application.id}`,
        updatedAt: application.updated_at
      });
    }
  }

  const sortedAttention = sortAttention(attention);
  const careerStatusCounts = input.applications.reduce<Record<string, number>>((counts, application) => {
    counts[application.application_status] = (counts[application.application_status] ?? 0) + 1;
    return counts;
  }, {});
  const hasHighPriority = sortedAttention.some((item) => item.severity === "high");

  return {
    period: weeklyReviewPeriod,
    generatedAt: endsAt.toISOString(),
    window: {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      days: WEEK_DAYS
    },
    thresholds: {
      staleProjectDays: STALE_PROJECT_DAYS,
      unfinishedSkillDays: UNFINISHED_SKILL_DAYS,
      applicationFollowUpDays: APPLICATION_FOLLOW_UP_DAYS
    },
    totals: {
      projects: input.projects.length,
      activeProjects: activeProjects.length,
      knowledge: input.knowledge.length,
      skills: input.skills.length,
      collections: input.collections.length,
      resumeVersions: input.resumeVersions.length,
      applications: input.applications.length
    },
    thisWeek: {
      projectsUpdated: input.projects.filter((item) => updatedWithin(item.updated_at, startsAt)).length,
      knowledgeUpdated: input.knowledge.filter((item) => updatedWithin(item.updated_at, startsAt)).length,
      skillsUpdated: input.skills.filter((item) => updatedWithin(item.updated_at, startsAt)).length,
      collectionsUpdated: input.collections.filter((item) => updatedWithin(item.updated_at, startsAt)).length,
      applicationsUpdated: input.applications.filter((item) => updatedWithin(item.updated_at, startsAt)).length
    },
    health: {
      status: hasHighPriority ? "action_required" : sortedAttention.length > 0 ? "watch" : "healthy",
      activeProjectsWithKnowledge: activeProjectsWithKnowledge.length,
      activeProjectsTotal: activeProjects.length,
      populatedCollections: input.collections.filter((collection) => collection.file_count > 0).length,
      collectionsTotal: input.collections.length,
      availableSkills: input.skills.filter((skill) => skill.status === "available").length,
      skillsTotal: input.skills.length
    },
    careerStatusCounts,
    attention: sortedAttention
  };
}

function emptyWeeklyReview() {
  return buildWeeklyReview({
    projects: [],
    knowledge: [],
    skills: [],
    collections: [],
    resumeVersions: [],
    applications: []
  });
}

export async function loadWeeklyReview(supabase: SupabaseClient): Promise<WeeklyReviewQueryResult> {
  const [projects, knowledge, skills, collections, resumeVersions, applications] = await Promise.all([
    supabase.from("projects").select("id,title,status,updated_at"),
    supabase.from("knowledge_notes").select("id,project_id,updated_at"),
    supabase.from("skills").select("id,name,status,updated_at"),
    supabase.from("document_collections").select("id,title,file_count,updated_at"),
    supabase.from("resume_versions").select("id,updated_at"),
    supabase.from("resume_jd_reviews").select("id,company_name,job_title,application_status,updated_at")
  ]);

  const failedQuery = [projects, knowledge, skills, collections, resumeVersions, applications].find((result) => result.error);

  if (failedQuery?.error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to load weekly review data.",
        status: 500
      }
    };
  }

  return {
    ok: true,
    data: buildWeeklyReview({
      projects: (projects.data ?? []) as ProjectRow[],
      knowledge: (knowledge.data ?? []) as KnowledgeRow[],
      skills: (skills.data ?? []) as SkillRow[],
      collections: (collections.data ?? []) as CollectionRow[],
      resumeVersions: (resumeVersions.data ?? []) as ResumeVersionRow[],
      applications: (applications.data ?? []) as ApplicationRow[]
    })
  };
}

export async function getWorkstationWeeklyReview(): Promise<WeeklyReviewQueryResult> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Workstation API data access is not configured.",
        status: 503
      }
    };
  }

  return loadWeeklyReview(supabase);
}

export { emptyWeeklyReview };
