// @lib/rate-limit.ts
import { boolean } from 'zod/v4';

const counts = new Map<string, { n: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit = 10, ms = 60_000): boolean {
  const now = Date.now();
  const e = counts.get(ip);
  if (!e || now > e.resetAt) {
    counts.set(ip, { n: 1, resetAt: now + ms });
    return true;
  }

  if (e.n >= limit) return false;
  e.n++;
  return true;
}
