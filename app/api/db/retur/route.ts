import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const produk = searchParams.get('produk');
  const month = searchParams.get('month'); // YYYY-MM

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (produk) where.produk = { contains: produk, mode: 'insensitive' };
  if (month) where.date = { startsWith: month };

  const records = await prisma.returData.findMany({
    where,
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, date, produk, cs, adv, jumlah, nilai, alasan, status } = body;

  const data = { date, produk, cs, adv, jumlah, nilai, alasan, status };

  if (id) {
    const record = await prisma.returData.update({ where: { id }, data });
    return NextResponse.json(record);
  }

  const record = await prisma.returData.create({ data });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.returData.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
