import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const month = searchParams.get('month'); // YYYY-MM

  const where: { type?: string; date?: { startsWith: string } } = {};
  if (type) where.type = type;
  if (month) where.date = { startsWith: month };

  const records = await prisma.meetingNote.findMany({
    where,
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, date, type, title, attendees, agenda, decisions, actionItems, notes } = body;

  const data = { date, type, title, attendees, agenda, decisions, actionItems, notes };

  if (id) {
    const record = await prisma.meetingNote.update({ where: { id }, data });
    return NextResponse.json(record);
  }

  const record = await prisma.meetingNote.create({ data });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.meetingNote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
