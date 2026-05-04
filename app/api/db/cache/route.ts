import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookmarkId = searchParams.get('bookmarkId');
  const sheetType = searchParams.get('sheetType');

  if (!bookmarkId) return NextResponse.json([]);

  const where: { bookmarkId: string; sheetType?: string } = { bookmarkId };
  if (sheetType) where.sheetType = sheetType;

  const cache = await prisma.cachedSheetData.findMany({ where });
  return NextResponse.json(cache.map(c => ({ ...c, data: JSON.parse(c.data) })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookmarkId, sheetName, sheetType, data } = body;

  if (!bookmarkId || !sheetName || !sheetType || data === undefined) {
    return NextResponse.json(
      { error: 'bookmarkId, sheetName, sheetType, dan data wajib diisi' },
      { status: 400 },
    );
  }

  // Delete old cache for this sheet type
  await prisma.cachedSheetData.deleteMany({
    where: { bookmarkId, sheetType },
  });

  const cache = await prisma.cachedSheetData.create({
    data: {
      bookmarkId,
      sheetName,
      sheetType,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json(cache);
}
