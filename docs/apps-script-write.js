/**
 * Google Apps Script untuk write ke Google Sheets dari Dashboard
 * 
 * Cara deploy:
 * 1. Buka Google Sheets → Extensions → Apps Script
 * 2. Hapus semua code default, paste script ini
 * 3. Klik Deploy → New deployment → Type: Web app
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Klik Deploy, lalu authorize
 * 7. Copy URL Web App, paste ke dashboard di tab "GSheet"
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'ping') {
      return jsonResponse({ success: true, message: 'Pong' });
    }

    const ss = SpreadsheetApp.openById(data.spreadsheetId);
    const sheet = ss.getSheetByName(data.sheetName);
    if (!sheet) {
      return jsonResponse({ success: false, message: 'Sheet not found: ' + data.sheetName });
    }

    if (data.action === 'append') {
      // Append rows to the end of the sheet
      const lastRow = sheet.getLastRow();
      const numRows = data.values.length;
      const numCols = data.values[0].length;
      const range = sheet.getRange(lastRow + 1, 1, numRows, numCols);
      range.setValues(data.values);
      return jsonResponse({
        success: true,
        message: `Appended ${numRows} rows`,
        updatedRange: `${data.sheetName}!A${lastRow + 1}`,
      });
    }

    // Default: write to specific range
    const range = sheet.getRange(data.range);
    range.setValues(data.values);
    return jsonResponse({
      success: true,
      message: `Written ${data.values.length} rows to ${data.range}`,
      updatedRange: `${data.sheetName}!${data.range}`,
    });

  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
