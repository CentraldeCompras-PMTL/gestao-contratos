import type { RequestHandler } from "express";

type RateLimitOptions = {
  windowMs: number;
  maxAttempts: number;
  message: string;
  keyPrefix: string;
  getKey?: (req: Parameters<RequestHandler>[0]) => string;
};

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: Parameters<RequestHandler>[0]) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }
  return req.ip || "unknown";
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  const {
    windowMs,
    maxAttempts,
    message,
    keyPrefix,
    getKey = (req) => getClientIp(req),
  } = options;

  return (req, res, next) => {
    const now = Date.now();
    const baseKey = getKey(req) || "unknown";
    const key = `${keyPrefix}:${baseKey}`;
    const current = store.get(key);

    if (!current || current.expiresAt <= now) {
      store.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      next();
      return;
    }

    if (current.count >= maxAttempts) {
      const retryAfter = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ message });
      return;
    }

    current.count += 1;
    store.set(key, current);
    next();
  };
}
