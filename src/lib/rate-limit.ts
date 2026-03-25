import { NextRequest } from "next/server";

type WindowEntry = {
  count: number;
  resetAt: number;
};

const windows = new Map<string, WindowEntry>();

function currentTimestamp(): number {
  return Date.now();
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function pruneExpired(now: number): void {
  if (windows.size < 5000) return;

  for (const [key, entry] of windows.entries()) {
    if (entry.resetAt <= now) {
      windows.delete(key);
    }
  }
}

export function checkRateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = currentTimestamp();
  pruneExpired(now);

  const clientKey = `${key}:${getClientIp(req)}`;
  const entry = windows.get(clientKey);

  if (!entry || entry.resetAt <= now) {
    windows.set(clientKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  windows.set(clientKey, entry);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}
