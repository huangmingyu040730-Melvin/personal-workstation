import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export function validateMarketBriefRunnerRequest(request: Request) {
  const expectedSecret = process.env.MARKET_BRIEF_RUNNER_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "Market brief runner is not configured." }, { status: 503 });
  }

  const receivedSecret = request.headers.get("x-market-brief-runner-secret");

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized market brief runner." }, { status: 401 });
  }

  return null;
}

export function getMarketBriefRunnerServiceClient() {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return {
      supabase: null,
      response: NextResponse.json({ error: "Market brief persistence is not configured." }, { status: 503 })
    };
  }

  return { supabase, response: null };
}

export async function readJsonBody(request: Request) {
  try {
    return { ok: true as const, body: await request.json() };
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 }) };
  }
}
