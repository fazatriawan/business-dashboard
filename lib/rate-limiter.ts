// ── Rate Limiter & Quota Tracker ─────────────────────────────────────────────
// Tracks per-provider usage to enable smart failover in the LLM Router

export interface ProviderQuota {
  name: 'gemini' | 'claude' | 'kimi';
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsToday: number;
  lastRequestAt: number; // timestamp ms
  errorsInLast5Min: number;
  isHealthy: boolean;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// Default conservative limits (adjust based on your API tiers)
const LIMITS: Record<string, { perMinute: number; perHour: number; perDay: number }> = {
  gemini: { perMinute: 60,  perHour: 1000, perDay: 10000 },
  claude: { perMinute: 30,  perHour: 500,  perDay: 5000 },
  kimi:   { perMinute: 60,  perHour: 1000, perDay: 10000 },
};

class RateLimiter {
  private quotas: Map<string, ProviderQuota> = new Map();

  constructor() {
    ['gemini', 'claude', 'kimi'].forEach(name => {
      this.quotas.set(name, {
        name: name as ProviderQuota['name'],
        requestsThisMinute: 0,
        requestsThisHour: 0,
        requestsToday: 0,
        lastRequestAt: 0,
        errorsInLast5Min: 0,
        isHealthy: true,
      });
    });
  }

  private getQuota(name: string): ProviderQuota {
    return this.quotas.get(name)!;
  }

  private decay(quota: ProviderQuota, now: number): void {
    const sinceLast = now - quota.lastRequestAt;
    if (sinceLast > MINUTE_MS) quota.requestsThisMinute = 0;
    if (sinceLast > HOUR_MS)   quota.requestsThisHour = 0;
    if (sinceLast > DAY_MS)    quota.requestsToday = 0;
    if (sinceLast > 5 * MINUTE_MS) quota.errorsInLast5Min = 0;
  }

  recordRequest(provider: string, success: boolean): void {
    const q = this.getQuota(provider);
    const now = Date.now();
    this.decay(q, now);
    q.lastRequestAt = now;
    q.requestsThisMinute++;
    q.requestsThisHour++;
    q.requestsToday++;
    if (!success) {
      q.errorsInLast5Min++;
      // Mark unhealthy if >5 errors in 5 min
      if (q.errorsInLast5Min > 5) q.isHealthy = false;
    } else {
      q.isHealthy = true;
    }
  }

  canUse(provider: string): boolean {
    const q = this.getQuota(provider);
    const now = Date.now();
    this.decay(q, now);
    if (!q.isHealthy) return false;
    const limits = LIMITS[provider];
    if (!limits) return false;
    return (
      q.requestsThisMinute < limits.perMinute &&
      q.requestsThisHour < limits.perHour &&
      q.requestsToday < limits.perDay
    );
  }

  getHealth(): Record<string, { available: boolean; minuteUsage: number; hourUsage: number; healthy: boolean }> {
    const result: Record<string, { available: boolean; minuteUsage: number; hourUsage: number; healthy: boolean }> = {};
    this.quotas.forEach((q, name) => {
      const limits = LIMITS[name];
      result[name] = {
        available: this.canUse(name),
        minuteUsage: limits ? Math.round((q.requestsThisMinute / limits.perMinute) * 100) : 0,
        hourUsage: limits ? Math.round((q.requestsThisHour / limits.perHour) * 100) : 0,
        healthy: q.isHealthy,
      };
    });
    return result;
  }

  // Reset health manually (e.g., after a cooldown period)
  resetHealth(provider: string): void {
    const q = this.getQuota(provider);
    q.isHealthy = true;
    q.errorsInLast5Min = 0;
  }
}

// Singleton instance (server-side only)
export const rateLimiter = new RateLimiter();
