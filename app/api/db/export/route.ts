import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const dbPath = join(process.cwd(), 'prisma', 'dev.db');
    const buffer = await readFile(dbPath);
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="business-dashboard-${timestamp}.db"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Database file not found' }, { status: 500 });
  }
}
