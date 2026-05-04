import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  let settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    settings = await prisma.appSettings.create({ data: { id: 'singleton' } });
  }
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    defaultSheetId,
    aiPriority,
    autoSyncEnabled,
    autoSyncInterval,
    alertRoasLow,
    alertRoasHigh,
    alertCaqHigh,
    alertCrLow,
    alertReturRateHigh,
  } = body;

  const settings = await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {
      defaultSheetId,
      aiPriority,
      autoSyncEnabled,
      autoSyncInterval,
      alertRoasLow,
      alertRoasHigh,
      alertCaqHigh,
      alertCrLow,
      alertReturRateHigh,
      updatedAt: new Date(),
    },
    create: {
      id: 'singleton',
      defaultSheetId,
      aiPriority,
      autoSyncEnabled,
      autoSyncInterval,
      alertRoasLow,
      alertRoasHigh,
      alertCaqHigh,
      alertCrLow,
      alertReturRateHigh,
    },
  });

  return NextResponse.json(settings);
}
