const rateLimits = new Map<string, number[]>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimits.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  return true;
}
