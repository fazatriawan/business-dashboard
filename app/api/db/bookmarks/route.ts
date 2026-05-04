import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  const bookmarks = await prisma.bookmarkedSheet.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { cachedData: true },
  });
  return NextResponse.json(bookmarks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { label, spreadsheetId, sheetMap } = body;

  const bookmark = await prisma.bookmarkedSheet.upsert({
    where: { spreadsheetId },
    update: { label, sheetMap: JSON.stringify(sheetMap), updatedAt: new Date() },
    create: { label, spreadsheetId, sheetMap: JSON.stringify(sheetMap) },
  });

  return NextResponse.json(bookmark);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.bookmarkedSheet.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
