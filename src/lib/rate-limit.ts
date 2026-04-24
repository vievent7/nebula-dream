type Bucket = {
  count: number;
  resetAt: number;
};

type LimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const globalStore = globalThis as unknown as {
  __nebulaRateLimitStore?: Map<string, Bucket>;
};

const store = globalStore.__nebulaRateLimitStore ?? new Map<string, Bucket>();
globalStore.__nebulaRateLimitStore = store;

export function checkRateLimit(key: string, options: LimitOptions): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  store.set(key, current);

  if (current.count > options.max) {
    const retryAfterMs = Math.max(0, current.resetAt - now);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
