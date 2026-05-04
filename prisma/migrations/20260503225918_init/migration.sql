-- CreateTable
CREATE TABLE "BookmarkedSheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "spreadsheetId" TEXT NOT NULL,
    "sheetMap" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedSheetData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookmarkId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "sheetType" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CachedSheetData_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "BookmarkedSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlySales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthYear" TEXT NOT NULL,
    "totalRevenue" REAL NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "totalAdSpend" REAL NOT NULL,
    "totalLeads" INTEGER NOT NULL,
    "roas" REAL NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bookmarkId" TEXT,
    CONSTRAINT "MonthlySales_bookmarkId_fkey" FOREIGN KEY ("bookmarkId") REFERENCES "BookmarkedSheet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "defaultSheetId" TEXT,
    "aiPriority" TEXT NOT NULL DEFAULT 'gemini,claude,kimi',
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "revenue" REAL NOT NULL,
    "adSpend" REAL NOT NULL,
    "leads" INTEGER NOT NULL,
    "closings" INTEGER NOT NULL,
    "botols" INTEGER NOT NULL,
    "cr" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkedSheet_spreadsheetId_key" ON "BookmarkedSheet"("spreadsheetId");

-- CreateIndex
CREATE INDEX "CachedSheetData_bookmarkId_sheetType_idx" ON "CachedSheetData"("bookmarkId", "sheetType");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySales_monthYear_key" ON "MonthlySales"("monthYear");

-- CreateIndex
CREATE INDEX "DailyMetric_monthYear_idx" ON "DailyMetric"("monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_date_key" ON "DailyMetric"("date");
