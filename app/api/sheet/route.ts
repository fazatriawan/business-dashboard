import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL diperlukan' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets mengembalikan status ${res.status}. Pastikan sheet dibagikan sebagai publik.` },
        { status: 400 }
      );
    }

    const text = await res.text();
    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data dari Google Sheets' }, { status: 500 });
  }
}
