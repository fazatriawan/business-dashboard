# Product Requirements Document — Business Dashboard

## Overview

Business Dashboard adalah aplikasi web internal berbasis Next.js untuk tim digital marketing dan manajemen bisnis. Aplikasi ini mengambil data dari Google Sheets, menghitung KPI iklan secara otomatis, menampilkan analisis performa CS dan advertiser, serta mengintegrasikan AI untuk insight bisnis real-time.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma + SQLite, Google Sheets API (via proxy), AI providers (Gemini, Kimi, Claude)

**Base URL (dev):** `http://localhost:3001`

---

## Core Features & API Endpoints

### 1. Google Sheets Integration — `/api/sheet`

**Method:** GET  
**Purpose:** Proxy untuk mengambil data CSV dari Google Sheets publik.

**Request:**
- Query param `url` (required): URL CSV Google Sheets

**Expected behavior:**
- Jika `url` tidak disertakan → response 400 dengan `{ error: "URL diperlukan" }`
- Jika Google Sheets mengembalikan non-200 → response 400 dengan pesan error
- Jika berhasil → response `text/csv` dengan isi data sheet
- Jika fetch gagal total → response 500

---

### 2. AI Analysis — `/api/analyze`

**Method:** POST  
**Purpose:** Menganalisis data KPI, CS, ADV menggunakan AI (Gemini/fallback providers) dan mengembalikan insight terstruktur.

**Request body:**
```json
{
  "bulan": "Mei 2026",
  "summary": { "totalOmset": 500000000, "roas": 3.2, "totalLead": 1200 },
  "rawData": [...],
  "csData": [...],
  "advData": [...],
  "advSpend": [...],
  "kpiBenchmarks": [...],
  "csDaily": [...],
  "dashboardCS": [...],
  "growth": [...],
  "errorReport": "Tidak ada error"
}
```

**Expected behavior:**
- Jika provider AI berhasil → response `{ quick: {...}, analysis: null, provider: "gemini" }`
- Jika response AI bukan valid JSON → response `{ analysis: "raw text", quick: null, provider: "..." }`
- Jika semua provider gagal → response 500 dengan error message

---

### 3. AI Router — `/api/router`

**Method:** POST  
**Purpose:** Routing request AI ke provider terbaik yang tersedia (Gemini, Kimi, Claude) dengan fallback otomatis.

**Expected behavior:**
- Mencoba provider secara berurutan hingga satu berhasil
- Jika semua gagal → response 503

---

### 4. Semantic Map — `/api/semantic-map`

**Method:** POST  
**Purpose:** Menghasilkan peta semantik dari data bisnis untuk visualisasi insight.

---

### 5. Drill Down — `/api/drill-down`

**Method:** POST  
**Purpose:** Analisis mendalam pada subset data tertentu (filter berdasarkan dimensi ads/CS/ADV).

---

### 6. Alerts — `/api/alerts`

**Method:** GET, POST  
**Purpose:** Mengelola alert otomatis berdasarkan threshold KPI.

**GET params:**
- `acknowledged` (boolean string): filter alert yang sudah/belum dibaca
- `limit` (number): batas jumlah alert

**POST body:**
```json
[
  { "type": "roas_low", "message": "ROAS di bawah threshold 2.0", "severity": "high" }
]
```

**Expected behavior:**
- GET → mengembalikan array alert
- POST → menyimpan alert baru, mengembalikan array alert yang tersimpan
- Alert dideduplikasi dalam window 1 jam per type

**Alert Types yang dihasilkan:**
- `roas_low` — ROAS < threshold (default 2.0)
- `roas_high` — ROAS > threshold (default 4.0)
- `caq_high` — Biaya akuisisi per closing > threshold (default Rp 200.000)
- `cr_low` — Closing rate < threshold (default 10%)
- `retur_rate_high` — Retur rate > threshold (default 5%)

---

### 7. Bookmarks — `/api/db/bookmarks`

**Method:** GET, POST, DELETE  
**Purpose:** Menyimpan dan mengelola bookmark Google Spreadsheet yang pernah diakses.

**GET:** Mengembalikan semua bookmark diurutkan terbaru.

**POST body:**
```json
{
  "label": "Mei 2026",
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  "sheetMap": { "ads": "Data Ads", "infoCS": "Info CS", "totalBiayaIklan": "Spend" }
}
```
**Expected behavior:** Upsert berdasarkan `spreadsheetId` — jika sudah ada, update label & sheetMap.

**DELETE:** Query param `id` (required). Hapus bookmark, response `{ success: true }`.

---

### 8. Cache — `/api/db/cache`

**Method:** GET, POST  
**Purpose:** Menyimpan data sheet yang sudah di-fetch ke SQLite agar bisa diakses offline.

**GET params:**
- `bookmarkId` (required): ID bookmark

**POST body:**
```json
{
  "bookmarkId": "bookmark-id",
  "sheetName": "Data Ads",
  "sheetType": "ads",
  "data": [{ "Tanggal": "01/05/2026", "Lead": "50" }]
}
```

**Expected behavior:**
- GET → mengembalikan array cached data untuk bookmark tersebut
- POST → menyimpan/update cache, response object cache yang disimpan

---

### 9. Monthly Sales — `/api/db/monthly-sales`

**Method:** GET, POST, DELETE  
**Purpose:** Menyimpan rekap penjualan bulanan manual.

---

### 10. Export — `/api/db/export`

**Method:** GET  
**Purpose:** Export seluruh database ke format JSON untuk backup.

**Expected behavior:**
- Response JSON berisi semua data: bookmarks, cache, monthly sales, meetings, retur
- Content-Disposition header untuk download file

---

### 11. Import — `/api/db/import`

**Method:** POST  
**Purpose:** Import data backup JSON ke database.

---

### 12. Meetings — `/api/db/meetings`

**Method:** GET, POST, DELETE  
**Purpose:** Mengelola jadwal meeting tim.

**POST body:**
```json
{
  "title": "Review Performa Iklan Mei",
  "date": "2026-05-10",
  "notes": "Bahas ROAS dan optimasi budget"
}
```

---

### 13. Retur — `/api/db/retur`

**Method:** GET, POST, DELETE  
**Purpose:** Mencatat data retur/pengembalian produk.

**POST body:**
```json
{
  "tanggal": "2026-05-04",
  "produk": "Produk A",
  "jumlah": 5,
  "alasan": "Cacat produk"
}
```

---

### 14. Retur Upload — `/api/db/retur/upload`

**Method:** POST  
**Purpose:** Upload file CSV/Excel untuk import data retur massal.

---

### 15. Settings — `/api/db/settings`

**Method:** GET, POST  
**Purpose:** Menyimpan konfigurasi threshold alert dan pengaturan auto-sync.

**GET:** Mengembalikan settings saat ini.

**POST body:**
```json
{
  "alertRoasLow": 2.0,
  "alertRoasHigh": 4.0,
  "alertCaqHigh": 200000,
  "alertCrLow": 10.0,
  "alertReturRateHigh": 5.0,
  "autoSyncEnabled": true,
  "autoSyncInterval": 30
}
```

---

### 16. Chat AI — `/api/chat`

**Method:** POST  
**Purpose:** Asisten AI untuk Q&A bisnis dan morning briefing, dengan fallback multi-provider (Kimi → Claude → Gemini).

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Bagaimana performa ROAS bulan ini?" }
  ],
  "task": "chat",
  "context": {
    "bulan": "Mei 2026",
    "kpi": { "roas": 3.2, "totalOmset": 500000000 },
    "topAlerts": ["ROAS di bawah threshold pada tanggal 3 Mei"]
  }
}
```

**Task values:**
- `chat` — Q&A bisnis umum
- `briefing` — Morning briefing terstruktur dengan prioritas harian

**Expected behavior:**
- Jika `messages` kosong atau tidak ada → response 400
- Mencoba Kimi → Claude → Gemini secara berurutan
- Jika berhasil → `{ message: "...", provider: "kimi", task: "chat" }`
- Jika semua provider gagal → response 503 dengan daftar error per provider
- Konteks KPI diinjeksikan ke pesan user terakhir jika disertakan

---

## KPI Metrics yang Dihitung

| Metrik | Deskripsi |
|--------|-----------|
| `totalOmset` | Total omset/revenue dari data ads |
| `totalBudget` | Total budget iklan yang dikeluarkan |
| `roas` | Return on Ad Spend = Omset / Budget |
| `totalLead` | Total jumlah lead yang masuk |
| `totalClosing` | Total transaksi yang berhasil closing |
| `avgCR` | Rata-rata Closing Rate = Closing / Lead × 100% |
| `avgCAQ` | Rata-rata biaya akuisisi per closing = Budget / Closing |
| `evaluasiDominant` | Evaluasi status iklan: SCALE / HOLD / OFF / DOWNSCALE |

---

## Data Flow

```
Google Sheets (publik CSV)
    ↓ /api/sheet (proxy)
    ↓ parseAdsData() / parseCSIndividual() / parseADVIndividual()
    ↓ calcKPI()
SQLite (via Prisma)   ←→   /api/db/* (bookmarks, cache, settings, meetings, retur)
    ↓
Dashboard UI (React components)
    ↓ /api/analyze / /api/chat
AI Providers (Gemini / Kimi / Claude)
```

---

## Non-Functional Requirements

- **Ketersediaan data offline:** Data yang pernah di-fetch dapat dimuat dari cache SQLite tanpa koneksi ke Google Sheets
- **Fallback AI:** Jika satu AI provider gagal, sistem otomatis mencoba provider berikutnya
- **Auto-sync:** Dashboard dapat dikonfigurasi untuk refresh data secara periodik (interval dalam menit)
- **Alert deduplication:** Alert yang sama tidak muncul lebih dari sekali dalam jendela 1 jam
- **Dark mode:** Tema gelap/terang yang persisten via localStorage
- **Export/Import:** Seluruh data lokal (SQLite) dapat diekspor ke JSON dan diimpor kembali
