import { NextResponse } from "next/server";

export const WORKSTATION_API_VERSION = "v1";

export type WorkstationErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

type WorkstationResponseOptions = {
  requestId?: string;
};

const jsonHeaders = {
  "Cache-Control": "no-store"
};

export function workstationSuccess<T>(
  data: T,
  message = "Success",
  status = 200,
  options: WorkstationResponseOptions = {}
) {
  return NextResponse.json({
    ok: true,
    data,
    message,
    apiVersion: WORKSTATION_API_VERSION,
    ...(options.requestId ? { requestId: options.requestId } : {})
  }, {
    status,
    headers: jsonHeaders
  });
}

export function workstationError(
  code: WorkstationErrorCode,
  message: string,
  status: number,
  options: WorkstationResponseOptions = {}
) {
  return NextResponse.json({
    ok: false,
    error: {
      code,
      message
    },
    apiVersion: WORKSTATION_API_VERSION,
    ...(options.requestId ? { requestId: options.requestId } : {})
  }, {
    status,
    headers: jsonHeaders
  });
}
