import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, buildUserPrompt } from '../../../lib/gemini-prompt';
import { createProviders, analyzeWithRace } from '../../../lib/ai-providers';
import { prisma } from '../../../lib/prisma';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cacheKey(bulan: string, summary: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify({ bulan, summary }))
    .digest('hex')
    .slice(0, 24);
}

export async function POST(req: NextRequest) {
  const providers = createProviders();

  if (providers.length === 0) {
    return NextResponse.json(
      { error: 'Tidak ada AI provider yang dikonfigurasi. Harap set GEMINI_API_KEY, CLAUDE_API_KEY, atau KIMI_API_KEY.' },
      { status: 503 },
    );
  }

  try {
    const {
      summary,
      rawData,
      bulan,
      csData,
      advData,
      advSpend,
      kpiBenchmarks,
      csDaily,
      dashboardCS,
      growth,
      errorReport,
    } = await req.json();

    // ── Cache lookup ──────────────────────────────────────────────────────────
    const key = cacheKey(bulan, summary);
    const now = new Date();

    const cached = await prisma.aIAnalysisCache.findUnique({ where: { cacheKey: key } });
    if (cached && cached.expiresAt > now) {
      const parsed = JSON.parse(cached.result) as Record<string, unknown>;
      return NextResponse.json({ quick: parsed, analysis: null, provider: cached.provider, cached: true });
    }

    // ── Build prompt & call AI (parallel race) ────────────────────────────────
    const prompt = buildUserPrompt({
      bulan,
      dataAds:  JSON.stringify({ kpi: summary, harian: rawData }, null, 2).slice(0, 5000),
      dataCS:   csData?.length   ? JSON.stringify(csData,   null, 2).slice(0, 2000) : 'Tidak ada data',
      dataADV:  advData?.length  ? JSON.stringify(advData,  null, 2).slice(0, 2000) : 'Tidak ada data',
      dataADVSpend: advSpend?.length ? JSON.stringify(advSpend, null, 2).slice(0, 2000) : 'Tidak ada data',
      dataKPIBenchmark: kpiBenchmarks?.length ? JSON.stringify(kpiBenchmarks, null, 2).slice(0, 2000) : 'Tidak ada data',
      dataCSDaily: csDaily?.length ? JSON.stringify(csDaily, null, 2).slice(0, 2000) : 'Tidak ada data',
      dataDashboardCS: dashboardCS?.length ? JSON.stringify(dashboardCS, null, 2).slice(0, 2000) : 'Tidak ada data',
      dataGrowth: growth?.length ? JSON.stringify(growth, null, 2).slice(0, 1500) : 'Tidak ada data',
      errorReport: errorReport || 'Tidak ada error formula terdeteksi.',
    });

    const { text, provider } = await analyzeWithRace(providers, {
      prompt,
      systemInstruction: SYSTEM_PROMPT,
    });

    // ── Parse response ────────────────────────────────────────────────────────
    const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ analysis: text, quick: null, provider });
    }

    // ── Store in cache ────────────────────────────────────────────────────────
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
    await prisma.aIAnalysisCache.upsert({
      where: { cacheKey: key },
      create: { cacheKey: key, bulan, result: JSON.stringify(parsed), provider, expiresAt },
      update: { result: JSON.stringify(parsed), provider, expiresAt },
    });

    return NextResponse.json({ quick: parsed, analysis: null, provider });
  } catch (err) {
    console.error('AI Analysis error:', err);
    const msg = err instanceof Error ? err.message : 'Gagal menganalisis data dengan AI.';
    const allFailed = msg.startsWith('ALL_PROVIDERS_FAILED');
    return NextResponse.json(
      { error: allFailed ? `Semua AI provider gagal:\n${msg.replace('ALL_PROVIDERS_FAILED:\n', '')}` : msg },
      { status: allFailed ? 503 : 500 },
    );
  }
}
