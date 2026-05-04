// Generic parser for Target, Closing CS, Closing Produk sheets
// Returns cleaned rows with numeric values parsed

export function parseRpValue(val: string | undefined): number {
  if (!val) return 0;
  const s = val.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,(\d{2})(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  return parseFloat(s) || 0;
}

export function parseNumValue(val: string | undefined): number {
  if (!val || val === '-' || val.trim() === '') return 0;
  return parseFloat(val.toString().replace(',', '.')) || 0;
}

export function cleanRows(raw: Record<string, string>[]): Record<string, string | number>[] {
  return raw
    .filter(row => Object.values(row).some(v => v && v.trim()))
    .map(row => {
      const cleaned: Record<string, string | number> = {};
      for (const [key, val] of Object.entries(row)) {
        if (!key.trim()) continue;
        const trimmed = val?.trim() || '';
        // Auto-parse Rp values
        if (trimmed.startsWith('Rp') || trimmed.startsWith('rp')) {
          cleaned[key] = parseRpValue(trimmed);
        // Auto-parse percentage
        } else if (trimmed.endsWith('%')) {
          cleaned[key] = parseFloat(trimmed.replace(',', '.').replace('%', '')) || 0;
        // Auto-parse pure numbers
        } else if (/^[\d.,]+$/.test(trimmed)) {
          cleaned[key] = parseNumValue(trimmed);
        } else {
          cleaned[key] = trimmed;
        }
      }
      return cleaned;
    });
}
