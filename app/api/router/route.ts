import { NextRequest, NextResponse } from 'next/server';
import { smartRoute, getRouterHealth, type TaskType } from '../../../lib/ai-router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, payload, preferredProvider } = body as {
      task: TaskType;
      payload: unknown;
      preferredProvider?: 'gemini' | 'claude' | 'kimi';
    };

    if (!task || !payload) {
      return NextResponse.json({ error: 'task and payload are required' }, { status: 400 });
    }

    const result = await smartRoute({ task, payload, preferredProvider });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Router error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ health: getRouterHealth() });
}
