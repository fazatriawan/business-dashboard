import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, buildUserPrompt } from '../../../lib/gemini-prompt';
import { createProviders, analyzeWithFallback } from '../../../lib/ai-providers';

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

    const { text, provider } = await analyzeWithFallback(providers, {
      prompt,
      systemInstruction: SYSTEM_PROMPT,
    });

    // Strip markdown fence if AI wraps in ```json
    const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ analysis: text, quick: null, provider });
    }

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
