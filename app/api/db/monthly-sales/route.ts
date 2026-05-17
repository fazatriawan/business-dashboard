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

function assertMonthYear(monthYear: unknown): string | null {
  if (typeof monthYear !== 'string') return null;
  // Accept strict YYYY-MM only
  if (!/^\d{4}-\d{2}$/.test(monthYear)) return null;
  return monthYear;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mode = body?.mode;

  // mode !== 'sync' => manual behavior (existing)
  if (mode !== 'sync') {
    const { monthYear, totalRevenue, totalOrders, totalAdSpend, roas, notes } = body;

    const record = await prisma.monthlySales.upsert({
      where: { monthYear },
      update: { totalRevenue, totalOrders, totalAdSpend, roas, notes, totalLeads: 0 },
      create: { monthYear, totalRevenue, totalOrders, totalAdSpend, roas, notes, totalLeads: 0 },
    });

    return NextResponse.json(record);
  }

  // sync behavior
  const monthYear = assertMonthYear(body.monthYear);
  if (!monthYear) {
    return NextResponse.json({ error: 'monthYear wajib format YYYY-MM' }, { status: 400 });
  }

  const totalRevenue = toNumber(body.totalRevenue);
  const totalOrders = Math.max(0, Math.floor(toNumber(body.totalOrders)));
  const totalAdSpend = toNumber(body.totalAdSpend);
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl : null;

  if (totalRevenue < 0 || totalAdSpend < 0 || totalOrders < 0) {
    return NextResponse.json({ error: 'Nilai tidak valid' }, { status: 400 });
  }

  const roas = totalAdSpend > 0 ? Number((totalRevenue / totalAdSpend).toFixed(4)) : 0;

  const record = await prisma.monthlySales.upsert({
    where: { monthYear },
    update: {
      totalRevenue,
      totalOrders,
      totalAdSpend,
      roas,
      sourceUrl,
      notes: body.notes ?? null,
      totalLeads: 0,
    },
    create: {
      monthYear,
      totalRevenue,
      totalOrders,
      totalAdSpend,
      roas,
      sourceUrl,
      notes: body.notes ?? null,
      totalLeads: 0,
    },
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
