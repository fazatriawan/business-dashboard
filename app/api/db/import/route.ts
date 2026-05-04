import { NextRequest, NextResponse } from 'next/server';
import { writeFile, copyFile, rename } from 'fs/promises';
import { join } from 'path';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.name.endsWith('.db')) {
      return NextResponse.json({ error: 'Invalid file. Please upload a .db file.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dbDir = join(process.cwd(), 'prisma');
    const dbPath = join(dbDir, 'dev.db');
    const backupPath = join(dbDir, `dev.db.backup-${Date.now()}`);
    const tempPath = join(dbDir, 'dev.db.tmp');

    // Disconnect Prisma to release file locks
    await prisma.$disconnect();

    try {
      // Backup current database
      try {
        await copyFile(dbPath, backupPath);
      } catch {
        // If current db doesn't exist, skip backup
      }

      // Write new file to temp, then rename (atomic on most systems)
      await writeFile(tempPath, buffer);
      await rename(tempPath, dbPath);
    } catch (err: unknown) {
      // Reconnect on error
      await prisma.$connect();
      throw err;
    }

    // Reconnect Prisma
    await prisma.$connect();

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully. Please refresh the page.',
      backup: backupPath,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Restore failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
