// ponytail: in-memory rate limiter, cukup untuk single-instance.
// Ganti dengan Redis jika multi-instance / scale horizontal.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= maxAttempts) return false; // blocked
  entry.count++;
  return true; // allowed
}
