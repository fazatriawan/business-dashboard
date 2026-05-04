# PRD Gap Analysis: OmniSales Dashboard

## ✅ SUDAH SESUAI (Delivered)

| PRD Requirement | Status | Evidence |
|-----------------|--------|----------|
| Next.js + TypeScript + Tailwind | ✅ | `package.json`, `tsconfig.json` |
| Dashboard KPI (Omset, Budget, ROAS) | ✅ | `KPICards.tsx`, `MorningDashboard.tsx` |
| Google Sheets Integration | ✅ | `SmartInput.tsx`, `fetchSheet.ts`, `detectSheets.ts` |
| Data Visualization Charts | ✅ | `TrendChart.tsx` (Chart.js), `KPICards.tsx` |
| Export Reporting | ✅ | `ExportPPT.tsx` (7-slide PPT) |
| Drill-down Explorer | ✅ | `DrillDownPanel.tsx` + `/api/drill-down` |
| AI Analysis / Recommendations | ✅ | `AIAnalysis.tsx` + `ai-providers.ts` |
| Multi-Agent LLM Router | ✅ | `ai-router.ts` + `rate-limiter.ts` + `/api/router` |
| Semantic Column Mapping | ✅ | `semantic-mapper.ts` + `/api/semantic-map` |
| Auto-Failover (Gemini→Claude→Kimi) | ✅ | `ai-router.ts` with task-based routing |

## ⚠️ PARTIAL / NEED REFINEMENT

| PRD Requirement | Current State | Gap | Effort |
|-----------------|---------------|-----|--------|
| **Recharts** (PRD specifies Recharts) | Using Chart.js | Migrate to Recharts | Low |
| **Shadcn UI** (PRD specifies Shadcn) | Using raw Tailwind | Install + migrate components | Medium |
| **Spreadsheet OAuth** | Only public links | Add Google OAuth flow | Medium |
| **CSV/Excel Upload** | Not available | Add drag-drop file upload | Low |
| **PDF Export** | Only PPT export | Add PDF generation | Low |
| **True ROAS** | ROAS from internal data | Need Meta/Google Ads API | High |

## ❌ BELUM ADA (Major Gaps)

| PRD Requirement | Why It Matters | Effort |
|-----------------|----------------|--------|
| **MongoDB Database** | PRD requires persistent storage for MonthlySales, AdMetrics, Users | High |
| **Authentication & RBAC** | PRD requires login (Admin/Manager/Viewer roles) | Medium |
| **Meta/Google/TikTok Ads API** | PRD core: pull real ad spend, impressions, CPR | High |
| **Background Job / Cron** | PRD: auto-sync every 12 hours | Medium |
| **Playwright E2E Testing** | PRD specifies testing framework | Low |
| **Monthly Sales Collection** | PRD schema: store synced spreadsheet data in MongoDB | Medium |
| **AdAccounts Collection** | PRD schema: store connected ad platform accounts | Medium |

---

## 🔍 ROOT CAUSE: FOKUS BERBEDA

**PRD menggambarkan:**
> "Dashboard yang menggabungkan metrik pemasaran (Ad Spend dari Meta/Google Ads) dengan metrik bisnis aktual (Total Penjualan dari Spreadsheet)"

**Yang sudah dibangun:**
> "Dashboard internal untuk monitoring tim CS dan Advertiser dari spreadsheet operasional harian"

Perbedaan utama:
1. **PRD** fokus pada **Ads API + Sales Spreadsheet reconciliation**
2. **Existing** fokus pada **Internal team productivity (CS performance, ADV spend, Product closing)**

---

## 📋 REKOMENDASI PRIORITAS

### Option A: Pivot ke PRD (Major Refactor)
Ubah fokus dashboard dari internal team monitoring → Ads + Sales reconciliation
- Tambah MongoDB
- Tambah Auth (NextAuth)
- Tambah Meta/Google Ads API connectors
- Tambah CSV upload
- Ganti Chart.js → Recharts
- Tambah Shadcn UI

### Option B: Hybrid (Recommended)
Pertahankan existing internal dashboard, tambahkan modul baru untuk PRD requirements:
- **Tab baru: "Ads Integration"** → Connect Meta/Google Ads API
- **Tab baru: "Sales Sync"** → Upload CSV + Google OAuth + MongoDB storage
- **Tab baru: "True ROI"** → Compare Ads Spend (API) vs Sales (Spreadsheet)
- Tambah Auth untuk multi-user

### Option C: Minimum Viable
Tambahkan hanya yang paling impactful:
1. MongoDB + MonthlySales collection
2. CSV Upload module
3. PDF Export
4. Background sync scheduler

---

*Generated: 2026-05-04*
