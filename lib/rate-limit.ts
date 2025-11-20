/**
 * In-memory rate limiter for API routes
 * Uses a sliding window algorithm to track requests
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory (consider Redis for production scaling)
const limitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limitStore.entries()) {
    if (entry.resetTime < now) {
      limitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional identifier prefix (e.g., 'auth:', 'generate:')
   */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limit a request based on identifier (usually IP address)
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.prefix ? `${config.prefix}${identifier}` : identifier;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // Get or create entry
  let entry = limitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    limitStore.set(key, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  const success = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Get client identifier from request (IP address or fallback)
 *
 * @param request - Next.js request object
 * @returns Client identifier string
 */
export function getClientIdentifier(
  request: Request | { headers: Headers | { get?: (name: string) => string | null }; ip?: string }
): string {
  // Try to get real IP from various headers
  const headers = request.headers;

  if ('get' in headers && typeof headers.get === 'function') {
    // Web API Headers
    const forwarded = headers.get('x-forwarded-for');
    const real = headers.get('x-real-ip');
    const cfConnecting = headers.get('cf-connecting-ip');

    if (cfConnecting) return cfConnecting;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (real) return real;
  }

  // Next.js Request object
  if ('ip' in request && request.ip) {
    return request.ip;
  }

  // Fallback to generic identifier
  return 'anonymous';
}

/**
 * Preset rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict limit for authentication endpoints (5 requests per minute)
   */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 60,
    prefix: 'auth:',
  },

  /**
   * Moderate limit for generation endpoints (20 requests per minute)
   */
  GENERATE: {
    maxRequests: 20,
    windowSeconds: 60,
    prefix: 'generate:',
  },

  /**
   * Generous limit for general API endpoints (60 requests per minute)
   */
  API: {
    maxRequests: 60,
    windowSeconds: 60,
    prefix: 'api:',
  },
} as const;
