import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { parseReturCSV } from '../../../../../lib/parseRetur';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV kosong atau tidak valid' }, { status: 400 });
    }

    // Parse CSV manually (simple approach)
    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }

    const parsed = parseReturCSV(rows);
    if (parsed.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data retur yang valid ditemukan' }, { status: 400 });
    }

    // Batch insert
    const created = await prisma.$transaction(
      parsed.map(r =>
        prisma.returData.create({
          data: {
            date: r.date,
            produk: r.produk,
            cs: r.cs || null,
            adv: r.adv || null,
            jumlah: r.jumlah,
            nilai: r.nilai,
            alasan: r.alasan || null,
            status: r.status,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      imported: created.length,
      sample: parsed.slice(0, 3),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
