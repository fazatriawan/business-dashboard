
# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** business-dashboard
- **Date:** 2026-05-04
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

### Requirement: Google Sheet Proxy API
- **Description:** Fetches CSV data from a public Google Sheets URL via server-side proxy, melindungi CORS dan menambahkan error handling.

#### Test TC001 get_google_sheet_proxy_without_url
- **Test Code:** [TC001_get_google_sheet_proxy_without_url.py](./TC001_get_google_sheet_proxy_without_url.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/a3bec494-07e8-4edb-9147-64115de74f2a
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan pesan "URL diperlukan" saat parameter `url` tidak ada. Validasi input berjalan dengan benar.

---

### Requirement: AI Business Analysis API
- **Description:** Menganalisis data bisnis dashboard (ads, CS, ADV, KPI, growth) menggunakan AI providers dengan fallback otomatis.

#### Test TC002 post_ai_business_analysis_with_valid_data
- **Test Code:** [TC002_post_ai_business_analysis_with_valid_data.py](./TC002_post_ai_business_analysis_with_valid_data.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feae57fd-0c55-42bf-8785-3e15dd878120/308296a2-a9df-4c95-b92b-c9765c310569
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Fixed. `analyzeWithFallback` kini selalu mencoba semua provider (Gemini → Claude → Kimi) sebelum menyerah, tidak berhenti di error non-quota pertama. Route juga mengembalikan HTTP 503 (bukan 500) saat semua provider gagal, sehingga klien dapat membedakan kegagalan provider dari server error internal.

---

### Requirement: AI Smart Router API
- **Description:** Merutekan task AI ke provider terbaik yang tersedia dengan health monitoring.

#### Test TC003 post_ai_smart_router_missing_task
- **Test Code:** [TC003_post_ai_smart_router_missing_task.py](./TC003_post_ai_smart_router_missing_task.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/39e0d917-e25a-405e-ab23-5752874e5242
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "task and payload are required" saat field `task` tidak ada. Validasi berjalan dengan benar.

---

### Requirement: Semantic Sheet Mapper API
- **Description:** Memetakan header sheet dan sample baris ke semantic schema menggunakan AI.

#### Test TC004 post_semantic_sheet_mapper_with_missing_sheetname
- **Test Code:** [TC004_post_semantic_sheet_mapper_with_missing_sheetname.py](./TC004_post_semantic_sheet_mapper_with_missing_sheetname.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/16f5dba5-60e8-4fe5-bd18-de48354ce91c
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "sheetName and headers required" saat `sheetName` tidak ada. Guard validasi berfungsi dengan benar.

---

### Requirement: Entity Drill-Down Analysis API
- **Description:** Melakukan analisis mendalam pada entitas CS/ADV tertentu di seluruh sheet yang tersedia.

#### Test TC005 post_entity_drill_down_with_missing_entityname
- **Test Code:** [TC005_post_entity_drill_down_with_missing_entityname.py](./TC005_post_entity_drill_down_with_missing_entityname.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/a6733a8b-9c1d-4103-b76c-e3407eedf031
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "entityType, entityName, and availableSheets required" saat `entityName` tidak ada. Validasi input berjalan dengan benar.

---

### Requirement: Bookmarks Management API
- **Description:** Operasi CRUD untuk bookmarked Google Sheets yang disimpan di database SQLite.

#### Test TC006 delete_bookmark_without_id
- **Test Code:** [TC006_delete_bookmark_without_id.py](./TC006_delete_bookmark_without_id.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/e54f12cf-e1cd-4955-a3db-9ddaf9039151
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** DELETE endpoint mengembalikan HTTP 400 dengan "ID required" saat parameter `id` tidak ada. Konsisten dengan endpoint DELETE lainnya.

---

### Requirement: Sheet Cache Management API
- **Description:** Mengelola data sheet yang di-cache per bookmark dan sheet type untuk menghindari fetch berulang ke Google Sheets.

#### Test TC007 post_sheet_cache_without_bookmarkid
- **Test Code:** [TC007_post_sheet_cache_without_bookmarkid.py](./TC007_post_sheet_cache_without_bookmarkid.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2f227413-e4ed-454d-97dc-9d8b6b568df5/ecdd1c29-3535-458c-8024-b49039fe33d2
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Fixed. Ditambahkan validasi eksplisit untuk `bookmarkId`, `sheetName`, `sheetType`, dan `data` di awal POST handler. Kini mengembalikan HTTP 400 yang bersih sebelum menyentuh Prisma, bukan 500 dari constraint error database.

---

### Requirement: Monthly Sales Records API
- **Description:** Operasi CRUD untuk ringkasan penjualan bulanan (revenue, orders, ad spend, ROAS).

#### Test TC008 delete_monthly_sales_without_id
- **Test Code:** [TC008_delete_monthly_sales_without_id.py](./TC008_delete_monthly_sales_without_id.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/61d41d0a-568e-4912-b753-aa0f7ddeff7f
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** DELETE endpoint mengembalikan HTTP 400 dengan "ID required" saat parameter `id` tidak ada. Validasi konsisten dengan endpoint DELETE lainnya.

---

### Requirement: AI Chat Assistant API
- **Description:** Chat AI multi-provider untuk tanya jawab bisnis dan morning briefing dengan injeksi konteks.

#### Test TC009 post_chat_with_empty_messages_array
- **Test Code:** [TC009_post_chat_with_empty_messages_array.py](./TC009_post_chat_with_empty_messages_array.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/f8120754-4011-47f2-bb22-f980670792f6
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "messages array is required" saat array `messages` kosong. Guard validasi (`messages.length === 0`) berfungsi dengan benar.

---

### Requirement: Retur CSV Upload API
- **Description:** Import massal data retur produk dari upload file CSV.

#### Test TC010 post_retur_csv_upload_with_invalid_file
- **Test Code:** [TC010_post_retur_csv_upload_with_invalid_file.py](./TC010_post_retur_csv_upload_with_invalid_file.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ae9e9375-0372-4131-8f9d-fd56755ee6e5/a2e72457-5ab5-458e-b39c-fe1ab5159f72
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 saat file CSV tidak valid atau kosong. Validasi file dan pengecekan jumlah baris berjalan dengan benar.

---

## 3️⃣ Coverage & Matching Metrics

- **100%** of tests passed (10/10)

| Requirement                     | Total Tests | ✅ Passed | ❌ Failed |
|--------------------------------|-------------|-----------|-----------|
| Google Sheet Proxy API         | 1           | 1         | 0         |
| AI Business Analysis API       | 1           | 1         | 0         |
| AI Smart Router API            | 1           | 1         | 0         |
| Semantic Sheet Mapper API      | 1           | 1         | 0         |
| Entity Drill-Down Analysis API | 1           | 1         | 0         |
| Bookmarks Management API       | 1           | 1         | 0         |
| Sheet Cache Management API     | 1           | 1         | 0         |
| Monthly Sales Records API      | 1           | 1         | 0         |
| AI Chat Assistant API          | 1           | 1         | 0         |
| Retur CSV Upload API           | 1           | 1         | 0         |
| **Total**                      | **10**      | **10**    | **0**     |

---

## 4️⃣ Key Gaps / Risks

> **100% dari semua test passed (10/10). Semua 2 bug yang ditemukan telah diperbaiki.**

**Bug yang telah diperbaiki:**

1. **TC002 — AI Analysis fallback tidak lengkap (diperbaiki)**
   `analyzeWithFallback` di `lib/ai-providers.ts` dulu berhenti di error non-quota pertama tanpa mencoba provider berikutnya. Kini selalu mencoba semua provider. Route `/api/analyze` juga kini mengembalikan 503 (bukan 500) saat semua provider habis, membedakan kegagalan provider dari server error internal.

2. **TC007 — Cache POST tanpa validasi input (diperbaiki)**
   `POST /api/db/cache` dulu tidak memvalidasi field wajib, menyebabkan Prisma constraint error muncul sebagai 500. Kini mengembalikan 400 yang bersih saat `bookmarkId`, `sheetName`, `sheetType`, atau `data` tidak ada.

**Risiko keamanan yang masih ada (di luar scope test saat ini):**

3. **Tidak ada autentikasi** — semua 16 endpoint API dapat diakses publik tanpa auth check.

4. **SSRF via Sheet Proxy** — `GET /api/sheet?url=` menerima URL arbitrer tanpa whitelist.

5. **Database Restore tidak terproteksi** — `POST /api/db/import` mengganti seluruh database SQLite tanpa autentikasi atau validasi schema.
