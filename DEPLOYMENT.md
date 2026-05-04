# 🚀 Deployment Guide — Executive Dashboard Multi-Agent

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| Git | Any | Version control |

## External Services & API Keys

### Required (Minimum Viable)

1. **Google Gemini API Key**
   - Sign up: https://aistudio.google.com/app/apikey
   - Free tier: 60 requests/minute
   - Used for: Data ingestion, semantic mapping, analysis fallback

### Optional (For Full Multi-Agent Power)

2. **Anthropic Claude API Key**
   - Sign up: https://console.anthropic.com/
   - Used for: Deep reasoning, cross-sheet drill-downs

3. **Moonshot Kimi API Key**
   - Sign up: https://platform.moonshot.cn/
   - Used for: Conversational briefing, fallback chat

## Quick Start

```bash
# 1. Clone & install
git clone <repo-url>
cd business-dashboard
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Dev server
npm run dev
# → http://localhost:3000

# 4. Production build
npm run build
npm start
```

## Environment Variables

```bash
GEMINI_API_KEY=      # Required
CLAUDE_API_KEY=      # Optional (recommended)
KIMI_API_KEY=        # Optional
AI_PRIORITY=gemini,claude,kimi  # Router priority order
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 + Tailwind + Lucide Icons)           │
│  ├── Morning Dashboard (briefing + KPI)                    │
│  ├── Drill-Down Explorer (cross-sheet AI search)           │
│  ├── Smart Input (1-URL auto-detect tabs)                  │
│  └── Tab Views: KPI, Tren, CS, ADV, AI, Laporan           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  API Routes (Next.js App Router)                            │
│  ├── /api/router      → Smart LLM Router (POST)            │
│  ├── /api/semantic-map → Column mapping (POST)             │
│  ├── /api/drill-down   → Cross-sheet explorer (POST)       │
│  ├── /api/analyze      → Legacy multi-AI fallback          │
│  └── /api/sheet        → Google Sheets proxy               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Backend Logic (lib/)                                       │
│  ├── ai-router.ts      → Task-based model selection        │
│  ├── rate-limiter.ts   → Quota tracking & health           │
│  ├── semantic-mapper.ts→ AI column recognition             │
│  ├── drill-down.ts     → Relationship discovery            │
│  └── ai-providers.ts   → Gemini / Claude / Kimi clients    │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Agent Task Delegation

| Task | Preferred | Fallback Chain | Why |
|------|-----------|----------------|-----|
| Data Ingestion | Gemini | Kimi → Claude | High context window |
| Deep Analysis | Claude | Gemini → Kimi | Complex reasoning |
| Conversational | Kimi | Claude → Gemini | Natural formatting |
| Drill-Down | Claude | Gemini → Kimi | Cross-referencing |
| Semantic Map | Gemini | Claude → Kimi | Pattern matching |
| Morning Brief | Kimi | Claude → Gemini | Concise summaries |

## Deployment Options

### Option A: Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```
- Zero-config for Next.js
- Auto-scaling
- Edge functions for API routes

### Option B: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Option C: Self-Hosted
```bash
npm run build
npx next start -p 3000
```

## Monitoring

Check LLM router health:
```bash
curl http://localhost:3000/api/router
```

Response:
```json
{
  "health": {
    "gemini": { "available": true, "minuteUsage": 12, "hourUsage": 45, "healthy": true },
    "claude": { "available": true, "minuteUsage": 5, "hourUsage": 20, "healthy": true },
    "kimi":   { "available": true, "minuteUsage": 8, "hourUsage": 30, "healthy": true }
  }
}
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Failed to fetch" | API route down | Check `npm run dev` port |
| "All providers failed" | No API keys | Set `GEMINI_API_KEY` in `.env.local` |
| "Router error" | Rate limited | Wait 1 min or check `/api/router` health |
| Build fails | Type error | Run `npm run build` and fix reported errors |
