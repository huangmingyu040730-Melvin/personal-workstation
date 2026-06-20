import type { WorkstationRequestContext } from "./request-context";

type RateLimitBucket = {
  windowStart: number;
  total: number;
  write: number;
};

const WINDOW_MS = 60_000;
const TOTAL_LIMIT = 60;
const POST_LIMIT = 20;
const buckets = new Map<string, RateLimitBucket>();

function getWindowStart(now: number) {
  return Math.floor(now / WINDOW_MS) * WINDOW_MS;
}

function pruneBuckets(now: number) {
  const oldestAllowed = now - WINDOW_MS * 2;

  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.windowStart < oldestAllowed) {
      buckets.delete(key);
    }
  }
}

export function checkWorkstationRateLimit(context: WorkstationRequestContext) {
  const now = Date.now();
  const windowStart = getWindowStart(now);
  const tokenPart = context.tokenHash ?? "missing-token";
  const ipPart = context.ipHash ?? "missing-ip";
  const key = `${tokenPart}:${ipPart}:${windowStart}`;
  const bucket = buckets.get(key) ?? { windowStart, total: 0, write: 0 };

  bucket.total += 1;

  if (context.method === "POST" || context.method === "PATCH") {
    bucket.write += 1;
  }

  buckets.set(key, bucket);
  pruneBuckets(now);

  if (bucket.total > TOTAL_LIMIT || bucket.write > POST_LIMIT) {
    return {
      ok: false as const,
      limit: (context.method === "POST" || context.method === "PATCH") && bucket.write > POST_LIMIT ? POST_LIMIT : TOTAL_LIMIT
    };
  }

  return { ok: true as const };
}
