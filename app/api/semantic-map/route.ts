import { NextRequest, NextResponse } from 'next/server';
import { mapSheetSemantics } from '../../../lib/semantic-mapper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheetName, headers, sampleRows } = body;

    if (!sheetName || !headers) {
      return NextResponse.json({ error: 'sheetName and headers required' }, { status: 400 });
    }

    const schema = await mapSheetSemantics(sheetName, headers, sampleRows || []);
    return NextResponse.json(schema);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Semantic mapping error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
