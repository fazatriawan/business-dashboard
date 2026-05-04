import { NextRequest, NextResponse } from 'next/server';
import { performDrillDown } from '../../../lib/drill-down';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entityType, entityName, availableSheets } = body;

    if (!entityType || !entityName || !availableSheets) {
      return NextResponse.json(
        { error: 'entityType, entityName, and availableSheets required' },
        { status: 400 }
      );
    }

    const result = await performDrillDown({ entityType, entityName, availableSheets });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Drill-down error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
