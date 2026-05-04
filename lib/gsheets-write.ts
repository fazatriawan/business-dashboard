// Helper untuk write ke Google Sheets via Apps Script Web App

export interface SheetWritePayload {
  spreadsheetId: string;
  sheetName: string;
  range: string; // e.g. "A1"
  values: (string | number)[][];
}

export async function writeToSheet(
  appsScriptUrl: string,
  payload: SheetWritePayload
): Promise<{ success: boolean; message: string; updatedRange?: string }> {
  const res = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script error: ${res.status} ${text}`);
  }

  return await res.json();
}

export async function appendToSheet(
  appsScriptUrl: string,
  payload: Omit<SheetWritePayload, 'range'>
): Promise<{ success: boolean; message: string; updatedRange?: string }> {
  const res = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, action: 'append' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script error: ${res.status} ${text}`);
  }

  return await res.json();
}

export async function testConnection(appsScriptUrl: string): Promise<boolean> {
  try {
    const res = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping' }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
