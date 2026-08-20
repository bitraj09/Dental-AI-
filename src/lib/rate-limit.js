/**
 * In-memory rate limiter for API routes.
 * 
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });
 *   const { success } = await limiter.check(10, identifier); // 10 requests per interval
 */

const tokenBuckets = new Map();

export default function rateLimit({ interval = 60_000, uniqueTokenPerInterval = 500 } = {}) {
    return {
        check: (limit, token) =>
            new Promise((resolve) => {
                const now = Date.now();

                // Clean expired entries periodically
                if (tokenBuckets.size > uniqueTokenPerInterval) {
                    const cutoff = now - interval;
                    for (const [key, bucket] of tokenBuckets) {
                        if (bucket.lastReset < cutoff) tokenBuckets.delete(key);
                    }
                }

                let bucket = tokenBuckets.get(token);

                if (!bucket || now - bucket.lastReset > interval) {
                    bucket = { count: 0, lastReset: now };
                    tokenBuckets.set(token, bucket);
                }

                bucket.count += 1;

                if (bucket.count > limit) {
                    resolve({ success: false, remaining: 0 });
                } else {
                    resolve({ success: true, remaining: limit - bucket.count });
                }
            }),
    };
}
