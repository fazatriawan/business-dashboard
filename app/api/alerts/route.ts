import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const acknowledged = searchParams.get('acknowledged');
  const limit = searchParams.get('limit');
  const type = searchParams.get('type');

  const where: Record<string, unknown> = {};
  if (acknowledged !== null) where.acknowledged = acknowledged === 'true';
  if (type) where.type = type;

  const records = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit) : undefined,
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Bulk create alerts
  if (Array.isArray(body)) {
    const alerts = await prisma.$transaction(
      body.map((a: Record<string, unknown>) =>
        prisma.alert.create({
          data: {
            type: String(a.type),
            severity: String(a.severity),
            title: String(a.title),
            message: String(a.message),
            metric: a.metric ? String(a.metric) : null,
            threshold: a.threshold ? String(a.threshold) : null,
          },
        })
      )
    );
    return NextResponse.json(alerts);
  }

  // Acknowledge single alert
  if (body.id && body.acknowledged !== undefined) {
    const alert = await prisma.alert.update({
      where: { id: String(body.id) },
      data: { acknowledged: Boolean(body.acknowledged) },
    });
    return NextResponse.json(alert);
  }

  // Create single alert
  const alert = await prisma.alert.create({
    data: {
      type: String(body.type),
      severity: String(body.severity),
      title: String(body.title),
      message: String(body.message),
      metric: body.metric ? String(body.metric) : null,
      threshold: body.threshold ? String(body.threshold) : null,
    },
  });
  return NextResponse.json(alert);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const olderThanHours = searchParams.get('olderThanHours');

  if (id) {
    await prisma.alert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (olderThanHours) {
    const cutoff = new Date(Date.now() - parseInt(olderThanHours) * 60 * 60 * 1000);
    const result = await prisma.alert.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return NextResponse.json({ success: true, deleted: result.count });
  }

  return NextResponse.json({ error: 'Need id or olderThanHours' }, { status: 400 });
}
