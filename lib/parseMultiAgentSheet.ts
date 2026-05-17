import { CSRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  const cleaned = v.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,(\d{2})(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function pct(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.toString().replace(',', '.').replace('%', '')) || 0;
}

function norm(s: string): string {
  return s.replace(/[\n\r\s]+/g, ' ').trim().toLowerCase();
}

/**
 * Detects if a raw sheet is in "multi-agent" format.
 * Multi-agent format: the header row contains multiple CS/agent name column groups,
 * each group starting with a column like "[CS Name] Lead" or "[CS Name] Closing".
 * Heuristic: if there are 2+ columns that look like agent-group separators.
 */
export function isMultiAgentFormat(raw: Record<string, string>[]): boolean {
  if (raw.length === 0) return false;
  const headers = Object.keys(raw[0]);

  // Look for repeated patterns of lead/closing/botol columns that suggest multiple agents
  // Pattern: columns like "CS Nabila Lead", "CS Nabila Closing", "CS Vadia Lead", etc.
  const agentGroupPattern = /^(.+?)\s+(lead|closing|botol|whatsapp|wa)\b/i;
  const agentNames = new Set<string>();

  for (const h of headers) {
    const m = norm(h).match(/^(.+?)\s+(lead|closing|botol|whatsapp|wa)\b/);
    if (m) {
      const candidate = m[1].trim();
      // Filter out generic terms
      if (!['total', 'grand', 'real time', 'realtime', 'jumlah'].includes(candidate)) {
        agentNames.add(candidate);
      }
    }
  }

  // Also check for column groups separated by agent names in header values
  if (agentNames.size >= 2) return true;

  // Alternative: check if header row values (not keys) contain multiple CS names
  const firstRowVals = Object.values(raw[0]).map(v => norm(String(v)));
  const csNameCount = firstRowVals.filter(v =>
    v.startsWith('cs ') || v.match(/^[a-z]+\s+[a-z]+$/)
  ).length;

  return csNameCount >= 2;

  void agentGroupPattern; // suppress unused warning
}

interface AgentGroup {
  name: string;
  leadCol?: string;
  closingCol?: string;
  botolCol?: string;
  crCol?: string;
}

function detectAgentGroups(headers: string[]): AgentGroup[] {
  // Strategy: find columns that match "[AgentName] Lead/Closing/Botol" patterns
  const agentMap = new Map<string, AgentGroup>();

  for (const h of headers) {
    const n = norm(h);

    // Match patterns like "CS Nabila Lead", "Nabila Closing", "Agent1 Botol"
    const leadMatch = n.match(/^(.+?)\s+(?:lead|whatsapp|wa|pesan|chat|masuk)$/);
    const closingMatch = n.match(/^(.+?)\s+(?:closing|new customer|order)$/);
    const botolMatch = n.match(/^(.+?)\s+botol$/);
    const crMatch = n.match(/^(.+?)\s+(?:cr|closing rate)$/);

    if (leadMatch) {
      const name = leadMatch[1].trim();
      if (!['total', 'grand', 'real time', 'realtime', 'jumlah'].includes(name)) {
        const g = agentMap.get(name) ?? { name };
        g.leadCol = h;
        agentMap.set(name, g);
      }
    }
    if (closingMatch) {
      const name = closingMatch[1].trim();
      if (!['total', 'grand', 'real time', 'realtime', 'jumlah'].includes(name)) {
        const g = agentMap.get(name) ?? { name };
        g.closingCol = h;
        agentMap.set(name, g);
      }
    }
    if (botolMatch) {
      const name = botolMatch[1].trim();
      if (!['total', 'grand', 'real time', 'realtime', 'jumlah'].includes(name)) {
        const g = agentMap.get(name) ?? { name };
        g.botolCol = h;
        agentMap.set(name, g);
      }
    }
    if (crMatch) {
      const name = crMatch[1].trim();
      if (!['total', 'grand', 'real time', 'realtime', 'jumlah'].includes(name)) {
        const g = agentMap.get(name) ?? { name };
        g.crCol = h;
        agentMap.set(name, g);
      }
    }
  }

  return Array.from(agentMap.values()).filter(g => g.leadCol || g.closingCol);
}

/**
 * Parses a multi-agent CS sheet where each agent has their own column group.
 * Returns one CSRow per agent with aggregated totals.
 */
export function parseMultiAgentCS(raw: Record<string, string>[]): CSRow[] {
  if (raw.length === 0) return [];

  const headers = Object.keys(raw[0]);
  const agents = detectAgentGroups(headers);

  if (agents.length === 0) return [];

  // Find date column
  const dateCol = headers.find(h => /date|tanggal/i.test(h)) || headers[0];

  // Aggregate per agent across all data rows
  return agents.map((agent, idx) => {
    let totalLead = 0;
    let totalClosing = 0;
    let totalBotol = 0;
    let crSum = 0;
    let crCount = 0;

    for (const row of raw) {
      const dateVal = dateCol ? row[dateCol] : Object.values(row)[0] || '';
      // Skip header-like rows
      if (!dateVal || /date|tanggal|total|grand|header/i.test(dateVal)) continue;

      const lead = agent.leadCol ? num(row[agent.leadCol]) : 0;
      const closing = agent.closingCol ? num(row[agent.closingCol]) : 0;
      const botol = agent.botolCol ? num(row[agent.botolCol]) : 0;
      const cr = agent.crCol ? pct(row[agent.crCol]) : 0;

      totalLead += lead;
      totalClosing += closing;
      totalBotol += botol;
      if (cr > 0) { crSum += cr; crCount++; }
    }

    const avgCR = crCount > 0 ? crSum / crCount : (totalLead > 0 ? (totalClosing / totalLead) * 100 : 0);

    // Capitalize agent name for display
    const csName = agent.name
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      no: idx + 1,
      cs: csName,
      adv: '',
      produk: '',
      platform: '',
      realtimeLead: totalLead,
      closing: totalClosing,
      botol: totalBotol,
      cr: avgCR,
      ratio: 0,
      totalLead,
      totalClosing,
      totalBotol,
      avgCR,
      totalRatio: 0,
      jumlahRetur: 0,
      returRate: 0,
      crossSell: '',
    } satisfies CSRow;
  }).filter(row => row.totalLead > 0 || row.totalClosing > 0 || row.totalBotol > 0);
}
