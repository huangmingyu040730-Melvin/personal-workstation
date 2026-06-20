import { getAdminClient } from "@/lib/auth/admin";

export const WORKSTATION_LOG_STATUSES = ["success", "error"] as const;
export const WORKSTATION_LOG_ACTIONS = [
  "health.check",
  "projects.list",
  "projects.create",
  "knowledge.list",
  "knowledge.create",
  "skills.list",
  "skills.create",
  "document_collections.list",
  "document_collections.show",
  "documents.upload_intent",
  "documents.upload",
  "documents.finalize"
] as const;
export const WORKSTATION_LOG_TARGET_TYPES = [
  "system",
  "project",
  "knowledge",
  "skill",
  "document",
  "document_collection"
] as const;

export type WorkstationLogStatus = typeof WORKSTATION_LOG_STATUSES[number];
export type WorkstationLogAction = typeof WORKSTATION_LOG_ACTIONS[number];
export type WorkstationLogTargetType = typeof WORKSTATION_LOG_TARGET_TYPES[number];

export type WorkstationLogFilters = {
  status: WorkstationLogStatus | null;
  action: WorkstationLogAction | null;
  targetType: WorkstationLogTargetType | null;
};

export type WorkstationOperationLogRecord = {
  id: string;
  request_id: string;
  action: string;
  method: string;
  route: string;
  target_type: string | null;
  target_id: string | null;
  request_summary: Record<string, unknown> | null;
  status: WorkstationLogStatus;
  http_status: number | null;
  error_code: string | null;
  created_at: string;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeOption<T extends readonly string[]>(value: string | string[] | undefined, options: T): T[number] | null {
  const raw = getSingleParam(value)?.trim() ?? "";
  return options.includes(raw) ? raw as T[number] : null;
}

export function normalizeWorkstationLogFilters(params: Record<string, string | string[] | undefined>): WorkstationLogFilters {
  return {
    status: normalizeOption(params.status, WORKSTATION_LOG_STATUSES),
    action: normalizeOption(params.action, WORKSTATION_LOG_ACTIONS),
    targetType: normalizeOption(params.target_type, WORKSTATION_LOG_TARGET_TYPES)
  };
}

export async function getRecentWorkstationOperationLogs(filters: WorkstationLogFilters) {
  const { supabase, isAdmin } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return {
      logs: [] as WorkstationOperationLogRecord[],
      error: "当前账号没有管理员权限。"
    };
  }

  let query = supabase
    .from("workstation_operation_logs")
    .select("id,request_id,action,method,route,target_type,target_id,request_summary,status,http_status,error_code,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.targetType) {
    query = query.eq("target_type", filters.targetType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getRecentWorkstationOperationLogs failed", {
      code: error.code,
      message: error.message
    });

    return {
      logs: [] as WorkstationOperationLogRecord[],
      error: "Workstation operation logs 暂不可用，请确认 migration 和权限已部署。"
    };
  }

  return {
    logs: (data ?? []) as WorkstationOperationLogRecord[],
    error: null
  };
}
