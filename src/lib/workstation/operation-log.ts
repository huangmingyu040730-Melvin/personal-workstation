import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type WorkstationOperationStatus = "success" | "error";
export type WorkstationOperationTargetType =
  | "system"
  | "project"
  | "knowledge"
  | "skill"
  | "document_collection";

export type WorkstationOperationLogInput = {
  requestId: string;
  actorType?: "workstation_token";
  actorName?: string | null;
  tokenHash?: string | null;
  action: string;
  method: string;
  route: string;
  targetType?: WorkstationOperationTargetType | null;
  targetId?: string | null;
  requestSummary?: Record<string, unknown> | null;
  status: WorkstationOperationStatus;
  httpStatus: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeErrorMessage(message: string | null | undefined) {
  const normalized = message?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 240) : null;
}

function normalizeTargetId(targetId: string | null | undefined) {
  if (!targetId) {
    return null;
  }

  return UUID_PATTERN.test(targetId) ? targetId : null;
}

export async function writeWorkstationOperationLog(input: WorkstationOperationLogInput) {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("workstation_operation_logs")
    .insert({
      request_id: input.requestId,
      actor_type: input.actorType ?? "workstation_token",
      actor_name: input.actorName ?? null,
      token_hash: input.tokenHash ?? null,
      action: input.action,
      method: input.method,
      route: input.route,
      target_type: input.targetType ?? null,
      target_id: normalizeTargetId(input.targetId),
      request_summary: input.requestSummary ?? {},
      status: input.status,
      http_status: input.httpStatus,
      error_code: input.errorCode ?? null,
      error_message: sanitizeErrorMessage(input.errorMessage),
      ip_hash: input.ipHash ?? null,
      user_agent_hash: input.userAgentHash ?? null
    });

  if (error) {
    console.error("workstation_operation_logs insert failed", {
      action: input.action,
      requestId: input.requestId,
      code: error.code,
      message: error.message
    });
  }
}
