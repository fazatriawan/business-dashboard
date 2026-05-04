// ── Smart LLM Router ─────────────────────────────────────────────────────────
// Multi-Agent orchestration with task-based model selection + auto-failover

import { rateLimiter } from './rate-limiter';

export type TaskType = 'ingest' | 'analyze' | 'chat' | 'drilldown' | 'semantic_map' | 'briefing';
export type ProviderName = 'gemini' | 'claude' | 'kimi';

interface RouterConfig {
  task: TaskType;
  payload: unknown;
  preferredProvider?: ProviderName;
  timeoutMs?: number;
}

interface RouterResult {
  result: Record<string, unknown> | string;
  provider: ProviderName;
  task: TaskType;
  latencyMs: number;
  fallbackUsed: boolean;
}

// Task → Preferred provider mapping (based on model strengths)
const TASK_PREFERENCE: Record<TaskType, ProviderName[]> = {
  ingest:       ['gemini', 'kimi', 'claude'],   // Gemini: high context for messy data
  analyze:      ['claude', 'gemini', 'kimi'],   // Claude: deep reasoning
  chat:         ['kimi', 'claude', 'gemini'],   // Kimi: conversational formatting
  drilldown:    ['claude', 'gemini', 'kimi'],   // Claude: complex cross-sheet logic
  semantic_map: ['gemini', 'claude', 'kimi'],   // Gemini: good at pattern matching
  briefing:     ['kimi', 'claude', 'gemini'],   // Kimi: concise summaries
};

import { analyzeWithGemini, analyzeWithClaude, analyzeWithKimi } from './ai-providers';

const PROVIDER_FN: Record<ProviderName, (data: unknown) => Promise<Record<string, unknown>>> = {
  gemini: analyzeWithGemini,
  claude: analyzeWithClaude,
  kimi:   analyzeWithKimi,
};

export async function smartRoute(config: RouterConfig): Promise<RouterResult> {
  const { task, payload, preferredProvider, timeoutMs = 30000 } = config;
  const start = Date.now();

  const preferences = preferredProvider
    ? [preferredProvider, ...TASK_PREFERENCE[task].filter(p => p !== preferredProvider)]
    : TASK_PREFERENCE[task];

  let lastError = '';
  let fallbackUsed = false;

  for (let i = 0; i < preferences.length; i++) {
    const provider = preferences[i];

    // Check rate limiter
    if (!rateLimiter.canUse(provider)) {
      fallbackUsed = true;
      lastError = `${provider} rate limited or unhealthy`;
      continue;
    }

    try {
      const fn = PROVIDER_FN[provider];
      const result = await Promise.race([
        fn(payload),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        ),
      ]);

      rateLimiter.recordRequest(provider, true);

      return {
        result,
        provider,
        task,
        latencyMs: Date.now() - start,
        fallbackUsed: fallbackUsed || i > 0,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = `${provider}: ${msg}`;
      rateLimiter.recordRequest(provider, false);
      fallbackUsed = true;
    }
  }

  // All providers failed
  throw new Error(`Smart Router failed for task "${task}". Last: ${lastError}`);
}

export function getRouterHealth() {
  return rateLimiter.getHealth();
}

export function getTaskPreference(task: TaskType): ProviderName[] {
  return TASK_PREFERENCE[task];
}
