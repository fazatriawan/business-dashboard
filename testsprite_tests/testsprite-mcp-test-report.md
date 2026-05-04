
# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** business-dashboard
- **Date:** 2026-05-05
- **Prepared by:** TestSprite AI Team
- **Server Mode:** Production (`npm run build && npm run start`, port 3001)

---

## 2️⃣ Requirement Validation Summary

### Requirement: Google Sheet Proxy API
- **Description:** Fetches CSV data dari public Google Sheets URL via server-side proxy.

#### Test TC001 get_google_sheet_proxy_without_url
- **Test Code:** [TC001_get_google_sheet_proxy_without_url.py](./TC001_get_google_sheet_proxy_without_url.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/293de25f-99c7-4ba5-bb62-98cb91235cce
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "URL diperlukan" saat parameter `url` tidak ada. Lulus di production mode setelah clean rebuild (build artifact `./948.js` yang korup telah dibersihkan).

---

### Requirement: AI Business Analysis API
- **Description:** Menganalisis data bisnis menggunakan AI providers dengan fallback otomatis.

#### Test TC002 post_ai_business_analysis_with_valid_data
- **Test Code:** [TC002_post_ai_business_analysis_with_valid_data.py](./TC002_post_ai_business_analysis_with_valid_data.py)
- **Test Error:** AssertionError: Expected status code 200, got 503
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/e3a0d1a8-ae6d-46bf-a96a-e475ec42c5f7
- **Status:** ⚠️ Environment Issue
- **Severity:** LOW
- **Analysis / Findings:** Code behavior sudah benar — 503 adalah respons yang tepat saat semua provider gagal. Penyebab: (1) Gemini model `gemini-1.5-pro` deprecated → ganti ke `gemini-2.0-flash`, (2) Claude credit balance habis, (3) Kimi invalid authentication. Perbarui API keys di `.env.local` untuk menyelesaikan ini.

---

### Requirement: AI Smart Router API
- **Description:** Merutekan task AI ke provider terbaik yang tersedia.

#### Test TC003 post_ai_smart_router_missing_task
- **Test Code:** [TC003_post_ai_smart_router_missing_task.py](./TC003_post_ai_smart_router_missing_task.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/6a02021f-7674-46e7-ac07-404501a34d50
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "task and payload are required" saat `task` tidak ada.

---

### Requirement: Semantic Sheet Mapper API
- **Description:** Memetakan header sheet ke semantic schema menggunakan AI.

#### Test TC004 post_semantic_sheet_mapper_with_missing_sheetname
- **Test Code:** [TC004_post_semantic_sheet_mapper_with_missing_sheetname.py](./TC004_post_semantic_sheet_mapper_with_missing_sheetname.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/0363bd1f-83bd-4831-b165-029bb6a5c714
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "sheetName and headers required" saat `sheetName` tidak ada.

---

### Requirement: Entity Drill-Down Analysis API
- **Description:** Melakukan analisis mendalam pada entitas CS/ADV tertentu.

#### Test TC005 post_entity_drill_down_with_missing_entityname
- **Test Code:** [TC005_post_entity_drill_down_with_missing_entityname.py](./TC005_post_entity_drill_down_with_missing_entityname.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/e77808d9-a3fc-41a6-ab51-0b462f661015
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "entityType, entityName, and availableSheets required" saat `entityName` tidak ada.

---

### Requirement: Bookmarks Management API
- **Description:** CRUD operations untuk bookmarked Google Sheets.

#### Test TC006 delete_bookmark_without_id
- **Test Code:** [TC006_delete_bookmark_without_id.py](./TC006_delete_bookmark_without_id.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/c98b1b38-03f9-49e7-b25d-d2aaa3f4ea28
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** DELETE endpoint mengembalikan HTTP 400 dengan "ID required" saat `id` tidak ada.

---

### Requirement: Sheet Cache Management API
- **Description:** Mengelola cached sheet data per bookmark dan sheet type.

#### Test TC007 post_sheet_cache_without_bookmarkid
- **Test Code:** [TC007_post_sheet_cache_without_bookmarkid.py](./TC007_post_sheet_cache_without_bookmarkid.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/8ff25537-d6d6-4c18-b5c0-132a917d89e3
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** POST endpoint mengembalikan HTTP 400 yang bersih saat `bookmarkId` tidak ada (bug 500 sebelumnya sudah diperbaiki).

---

### Requirement: Monthly Sales Records API
- **Description:** CRUD operations untuk ringkasan penjualan bulanan.

#### Test TC008 delete_monthly_sales_without_id
- **Test Code:** [TC008_delete_monthly_sales_without_id.py](./TC008_delete_monthly_sales_without_id.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/97f1522b-2f16-431e-ae8b-1e7366fc46ea
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** DELETE endpoint mengembalikan HTTP 400 dengan "ID required" saat `id` tidak ada.

---

### Requirement: AI Chat Assistant API
- **Description:** Chat AI multi-provider untuk tanya jawab bisnis dan morning briefing.

#### Test TC009 post_chat_with_empty_messages_array
- **Test Code:** [TC009_post_chat_with_empty_messages_array.py](./TC009_post_chat_with_empty_messages_array.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/daf8305f-4082-4454-be09-9b80e1cbb53a
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 dengan "messages array is required" saat messages kosong.

---

### Requirement: Retur CSV Upload API
- **Description:** Import massal data retur produk dari upload file CSV.

#### Test TC010 post_retur_csv_upload_with_invalid_file
- **Test Code:** [TC010_post_retur_csv_upload_with_invalid_file.py](./TC010_post_retur_csv_upload_with_invalid_file.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/4a42db14-720e-4369-87d2-e03aa5b71ebb/3deb78bc-de9d-4962-a8c3-d2ece5fc4c33
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Endpoint mengembalikan HTTP 400 saat file CSV kosong atau tidak valid.

---

### Requirement: Database Import/Restore UI (Frontend)
- **Description:** UI untuk restore database SQLite dari file .db, termasuk validasi tipe file dan konfirmasi backup.

#### Test FE001 restore_database_from_valid_db_file
- **Test Code:** [testsprite_frontend_test_plan.json](./testsprite_frontend_test_plan.json)
- **Test Error:**
- **Test Visualization and Result:** *(Awaiting Playwright execution)*
- **Status:** ⏳ Pending
- **Severity:** HIGH
- **Analysis / Findings:** Test plan sudah dibuat. Steps: navigate ke halaman restore → upload valid `.db` file → verify konfirmasi sukses dan nama backup muncul di UI.

#### Test FE002 reject_restore_with_non_db_file
- **Test Code:** [testsprite_frontend_test_plan.json](./testsprite_frontend_test_plan.json)
- **Test Error:**
- **Test Visualization and Result:** *(Awaiting Playwright execution)*
- **Status:** ⏳ Pending
- **Severity:** LOW
- **Analysis / Findings:** Test plan sudah dibuat. Steps: upload file non-`.db` → verify error validasi tipe file muncul dan restore tidak dilanjutkan.

---

## 3️⃣ Coverage & Matching Metrics

- **Backend (production mode): 9/10 passed (90%)** — 1 environment issue
- **Frontend UI: 2/2 plans ready** — pending Playwright browser execution

| Requirement                     | Total Tests | ✅ Passed | ⚠️ Env Issue | ⏳ Pending |
|--------------------------------|-------------|-----------|-------------|-----------|
| Google Sheet Proxy API         | 1           | 1         | 0           | 0         |
| AI Business Analysis API       | 1           | 0         | 1           | 0         |
| AI Smart Router API            | 1           | 1         | 0           | 0         |
| Semantic Sheet Mapper API      | 1           | 1         | 0           | 0         |
| Entity Drill-Down Analysis API | 1           | 1         | 0           | 0         |
| Bookmarks Management API       | 1           | 1         | 0           | 0         |
| Sheet Cache Management API     | 1           | 1         | 0           | 0         |
| Monthly Sales Records API      | 1           | 1         | 0           | 0         |
| AI Chat Assistant API          | 1           | 1         | 0           | 0         |
| Retur CSV Upload API           | 1           | 1         | 0           | 0         |
| Database Import/Restore UI     | 2           | 0         | 0           | 2         |
| **Total**                      | **12**      | **9**     | **1**       | **2**     |

---

## 4️⃣ Key Gaps / Risks

> **Backend production: 9/10 passed. 1 environment issue. Frontend: 2 test plans pending.**

**Temuan dari production mode run:**

1. **Build artifact korup** — `.next` folder yang di-build sebelumnya mengandung chunk `./948.js` yang hilang, menyebabkan semua routes return 500. **Fix:** clean rebuild (`rm -rf .next && npm run build`) sudah menyelesaikan masalah ini. Disarankan menambahkan `.next/` ke `.gitignore` jika belum ada.

2. **TC002 environment issue (API keys)** — Semua 3 provider gagal:
   - Gemini: model `gemini-1.5-pro` deprecated → ganti ke `gemini-2.0-flash` di `.env.local`
   - Claude: credit balance habis → top up atau ganti key
   - Kimi: invalid authentication → perbarui `KIMI_API_KEY`

3. **Frontend tests FE001/FE002** — Test plan Database Import/Restore UI sudah dibuat tapi memerlukan browser automation (Playwright) untuk dieksekusi. TestSprite saat ini mengeksekusi tests sebagai Python HTTP requests (BACKEND mode). Frontend UI tests memerlukan konfigurasi Playwright terpisah.

**Risiko keamanan yang masih ada:**
- Semua endpoint tidak memiliki autentikasi
- SSRF via `/api/sheet?url=`
- Database restore tidak terproteksi (`POST /api/db/import`)
