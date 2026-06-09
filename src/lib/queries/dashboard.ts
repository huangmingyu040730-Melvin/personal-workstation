import type { ActivityLogRecord } from "@/lib/content-types";
import { activityFeed } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { countPendingAccessRequests } from "./access-requests";
import { getUpcomingCalendarEvents } from "./calendar";
import { countPublicKnowledgeNotes, getRecentKnowledgeNotes } from "./knowledge";
import { countPublicProjects, getProjects } from "./projects";
import { getPublicationStats, getRecentPublications } from "./publications";
import { getRecentResumeItems, getResumeStats } from "./resume";
import { countAvailableSkills, countPublicSkills, getSkills } from "./skills";

function mockActivityFallback(): ActivityLogRecord[] {
  return activityFeed.map((activity, index) => ({
    id: String(index),
    action: "mock_activity",
    entity_type: "mock",
    entity_id: null,
    metadata: { title: activity },
    created_at: new Date().toISOString()
  }));
}

export async function getDashboardData() {
  const [
    projects,
    notes,
    skills,
    availableSkillCount,
    publications,
    publicationStats,
    activityLogs,
    publicProjectCount,
    publicSkillCount,
    publicKnowledgeCount,
    pendingAccessRequestCount,
    upcomingCalendarEvents,
    resumeStats,
    recentResumeItems
  ] = await Promise.all([
    getProjects(),
    getRecentKnowledgeNotes(4),
    getSkills(),
    countAvailableSkills(),
    getRecentPublications(4),
    getPublicationStats(),
    getRecentActivityLogs(6),
    countPublicProjects(),
    countPublicSkills(),
    countPublicKnowledgeNotes(),
    countPendingAccessRequests(),
    getUpcomingCalendarEvents(5),
    getResumeStats(),
    getRecentResumeItems(3)
  ]);

  const inProgressProjects = projects.filter((project) => project.status === "in_progress");

  return {
    projects,
    inProgressProjects,
    notes,
    skills: skills.slice(0, 4),
    availableSkillCount,
    publications,
    publicationStats,
    publicCounts: {
      projects: publicProjectCount,
      publications: publicationStats.publicCount,
      skills: publicSkillCount,
      knowledge: publicKnowledgeCount
    },
    pendingAccessRequestCount,
    upcomingCalendarEvents,
    resumeStats,
    recentResumeItems,
    activityLogs
  };
}

export async function getRecentActivityLogs(limit = 6) {
  const supabase = await createClient();

  if (!supabase) {
    return mockActivityFallback().slice(0, limit);
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentActivityLogs failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as ActivityLogRecord[];
}
