import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthYear = searchParams.get('monthYear');

  if (monthYear) {
    const record = await prisma.monthlySales.findUnique({ where: { monthYear } });
    return NextResponse.json(record);
  }

  const records = await prisma.monthlySales.findMany({ orderBy: { monthYear: 'desc' } });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { monthYear, totalRevenue, totalOrders, totalAdSpend, roas, notes } = body;

  const record = await prisma.monthlySales.upsert({
    where: { monthYear },
    update: { totalRevenue, totalOrders, totalAdSpend, roas, notes, totalLeads: 0 },
    create: { monthYear, totalRevenue, totalOrders, totalAdSpend, roas, notes, totalLeads: 0 },
  });

  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.monthlySales.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
