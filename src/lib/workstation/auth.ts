import { timingSafeEqual } from "crypto";
import { workstationError } from "./api-response";

export const workstationCapabilities = ["read_assets", "create_assets"] as const;

export type WorkstationCapability = typeof workstationCapabilities[number];

type WorkstationAuthResult =
  | { ok: true; capabilities: WorkstationCapability[] }
  | { ok: false; response: ReturnType<typeof workstationError> };

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function authenticateWorkstationRequest(request: Request): WorkstationAuthResult {
  const configuredToken = process.env.WORKSTATION_API_TOKEN?.trim();
  const providedToken = extractBearerToken(request);

  if (!configuredToken || !providedToken || !constantTimeEqual(providedToken, configuredToken)) {
    return {
      ok: false,
      response: workstationError("UNAUTHORIZED", "Missing or invalid Workstation API token.", 401)
    };
  }

  return {
    ok: true,
    capabilities: [...workstationCapabilities]
  };
}

export function requireWorkstationCapability(
  auth: Extract<WorkstationAuthResult, { ok: true }>,
  capability: WorkstationCapability
) {
  if (!auth.capabilities.includes(capability)) {
    return workstationError("FORBIDDEN", "The Workstation API token does not allow this operation.", 403);
  }

  return null;
}
