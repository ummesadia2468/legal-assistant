import "server-only";
import { AppError } from "./errors";

// A very small in-memory rate limiter: N requests per window per visitor.
//
// LIMITATION: the counters live in this server process's memory. That is
// fine for local development and a single server. On serverless hosting
// (e.g. Vercel) each instance has its own memory, so for production you
// should replace this with a shared store such as Upstash Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): void {
  const now = Date.now();

  // Occasionally drop expired entries so the map can't grow forever.
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new AppError(
      "rate_limited",
      `You're going a little fast. Please wait ${retryAfterSeconds} seconds and try again.`,
      429,
      { retryAfterSeconds },
    );
  }
  bucket.count += 1;
}
