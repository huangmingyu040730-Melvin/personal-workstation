import type { AiDraftTargetType, AiRawNoteDraftResult } from "@/lib/ai-raw-note-draft-lab";

export type AiDraftHandoffTarget = AiDraftTargetType;

export type AiDraftHandoffPayload = {
  version: 1;
  targetType: AiDraftHandoffTarget;
  draft: AiRawNoteDraftResult;
  savedAt: string;
};

const handoffKeyPrefix = "personal-workstation:ai-draft-handoff:";

const targetNewFormPaths: Record<AiDraftHandoffTarget, string> = {
  project: "/dashboard/projects/new",
  publication: "/dashboard/publications/new",
  knowledge: "/dashboard/knowledge/new",
  skill: "/dashboard/skills/new"
};

export function getAiDraftHandoffNewFormPath(targetType: AiDraftHandoffTarget) {
  return targetNewFormPaths[targetType];
}

export function saveAiDraftHandoff(targetType: AiDraftHandoffTarget, draft: AiRawNoteDraftResult) {
  if (!canUseSessionStorage()) {
    return false;
  }

  const payload: AiDraftHandoffPayload = {
    version: 1,
    targetType,
    draft,
    savedAt: new Date().toISOString()
  };

  try {
    window.sessionStorage.setItem(getAiDraftHandoffKey(targetType), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function readAiDraftHandoff(targetType: AiDraftHandoffTarget) {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const rawPayload = window.sessionStorage.getItem(getAiDraftHandoffKey(targetType));
    if (!rawPayload) {
      return null;
    }

    const parsed = JSON.parse(rawPayload) as Partial<AiDraftHandoffPayload>;
    if (parsed.version !== 1 || parsed.targetType !== targetType || !parsed.draft) {
      return null;
    }

    return parsed as AiDraftHandoffPayload;
  } catch {
    return null;
  }
}

export function clearAiDraftHandoff(targetType: AiDraftHandoffTarget) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(getAiDraftHandoffKey(targetType));
  } catch {
    // Ignore browser storage errors; the UI still avoids any database write.
  }
}

function getAiDraftHandoffKey(targetType: AiDraftHandoffTarget) {
  return `${handoffKeyPrefix}${targetType}`;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && "sessionStorage" in window;
}
