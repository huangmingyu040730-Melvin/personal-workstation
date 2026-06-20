import { randomBytes, createHash } from "crypto";
import { workstationError, workstationSuccess, type WorkstationErrorCode } from "./api-response";
import {
  type WorkstationOperationLogInput,
  type WorkstationOperationTargetType,
  writeWorkstationOperationLog
} from "./operation-log";

export type WorkstationRequestContext = {
  requestId: string;
  action: string;
  method: "GET" | "POST";
  route: string;
  targetType: WorkstationOperationTargetType;
  tokenHash: string | null;
  ipHash: string | null;
  userAgentHash: string | null;
};

type FinishLogInput = {
  requestSummary?: Record<string, unknown> | null;
  targetId?: string | null;
};

type ErrorLogInput = FinishLogInput & {
  code: WorkstationErrorCode;
  message: string;
  status: number;
};

function hashValue(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return createHash("sha256").update(normalized).digest("hex").slice(0, 12);
}

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function extractIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || null;
}

function getRoute(request: Request) {
  try {
    return new URL(request.url).pathname;
  } catch {
    return "/api/workstation";
  }
}

export function createWorkstationRequestId() {
  return `wreq_${randomBytes(9).toString("base64url")}`;
}

export function createWorkstationRequestContext(
  request: Request,
  action: string,
  targetType: WorkstationOperationTargetType
): WorkstationRequestContext {
  const method = request.method === "POST" ? "POST" : "GET";

  return {
    requestId: createWorkstationRequestId(),
    action,
    method,
    route: getRoute(request),
    targetType,
    tokenHash: hashValue(extractBearerToken(request)),
    ipHash: hashValue(extractIp(request)),
    userAgentHash: hashValue(request.headers.get("user-agent"))
  };
}

async function recordOperation(
  context: WorkstationRequestContext,
  input: Omit<WorkstationOperationLogInput, keyof WorkstationRequestContext | "actorType">
) {
  await writeWorkstationOperationLog({
    ...context,
    actorType: "workstation_token",
    ...input
  });
}

export async function finishWorkstationError(context: WorkstationRequestContext, input: ErrorLogInput) {
  const response = workstationError(input.code, input.message, input.status, {
    requestId: context.requestId
  });

  await recordOperation(context, {
    status: "error",
    httpStatus: input.status,
    errorCode: input.code,
    errorMessage: input.message,
    requestSummary: input.requestSummary,
    targetId: input.targetId
  });

  return response;
}

export async function finishWorkstationResponse<T>(
  context: WorkstationRequestContext,
  data: T,
  input: FinishLogInput & {
    message?: string;
    status?: number;
  } = {}
) {
  const status = input.status ?? 200;
  const response = workstationSuccess(data, input.message, status, {
    requestId: context.requestId
  });

  await recordOperation(context, {
    status: "success",
    httpStatus: status,
    requestSummary: input.requestSummary,
    targetId: input.targetId
  });

  return response;
}
