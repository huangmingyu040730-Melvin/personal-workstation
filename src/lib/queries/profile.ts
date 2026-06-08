import type { ProfileRecord } from "@/lib/content-types";
import { profile as mockProfile } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

function mockProfileFallback(): ProfileRecord {
  return {
    id: "mock-profile",
    display_name: mockProfile.name,
    email: null,
    headline: mockProfile.role,
    bio: mockProfile.intro,
    education: mockProfile.education,
    role_title: "学生｜金融研究｜量化策略｜AI 辅助研究",
    organization: null,
    location: mockProfile.contact.location,
    research_interests: mockProfile.interests,
    skill_tags: mockProfile.skills,
    contact: {},
    social_links: {},
    avatar_url: null,
    resume_url: null,
    is_public: true,
    visibility: "public",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  };
}

export async function getEditableProfile() {
  const supabase = await createClient();

  if (!supabase) {
    return mockProfileFallback();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getEditableProfile failed", { code: error.code, message: error.message });
    return mockProfileFallback();
  }

  return (data as ProfileRecord | null) ?? null;
}

export async function getPublicProfile() {
  const supabase = await createClient();

  if (!supabase) {
    return mockProfileFallback();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("visibility", "public")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getPublicProfile failed", { code: error.code, message: error.message });
    return null;
  }

  return data as ProfileRecord | null;
}

export function getProfileFallback() {
  return mockProfileFallback();
}
