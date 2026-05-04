import { KPISummary, ADVSpendRow, DashboardCSRow, CSRow, ADVRow } from './types';

export interface AlertInput {
  kpi: KPISummary;
  advSpend: ADVSpendRow[];
  dashboardCS: DashboardCSRow[];
  csData: CSRow[];
  advData: ADVRow[];
  returItems?: { jumlah: number; nilai: number; produk: string }[];
  totalOrders?: number;
}

export interface ThresholdConfig {
  alertRoasLow: number;
  alertRoasHigh: number;
  alertCaqHigh: number;
  alertCrLow: number;
  alertReturRateHigh: number;
}

export interface GeneratedAlert {
  type: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  metric?: string;
  threshold?: string;
}

function fmtRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

export function generateAlerts(
  input: AlertInput,
  thresholds: ThresholdConfig,
): GeneratedAlert[] {
  const { kpi, advSpend, dashboardCS, advData, returItems, totalOrders } = input;
  const alerts: GeneratedAlert[] = [];

  // ── ROAS alerts ────────────────────────────────────────────────────────────
  if (kpi.roas < thresholds.alertRoasLow) {
    alerts.push({
      type: 'roas_low',
      severity: 'critical',
      title: 'ROAS Rendah',
      message: `ROAS saat ini ${kpi.roas.toFixed(2)}x, di bawah threshold ${thresholds.alertRoasLow}x. Evaluasi campaign yang tidak efisien dan pertimbangkan pause atau downscale.`,
      metric: `${kpi.roas.toFixed(2)}x`,
      threshold: `${thresholds.alertRoasLow}x`,
    });
  } else if (kpi.roas >= thresholds.alertRoasHigh) {
    alerts.push({
      type: 'roas_high',
      severity: 'success',
      title: 'ROAS Optimal',
      message: `ROAS ${kpi.roas.toFixed(2)}x melampaui threshold ${thresholds.alertRoasHigh}x — pertimbangkan scale up budget untuk campaign terbaik.`,
      metric: `${kpi.roas.toFixed(2)}x`,
      threshold: `${thresholds.alertRoasHigh}x`,
    });
  }

  // ── CAQ alert ──────────────────────────────────────────────────────────────
  if (kpi.avgCAQ > thresholds.alertCaqHigh) {
    alerts.push({
      type: 'caq_high',
      severity: 'warning',
      title: 'Biaya Akuisisi Tinggi',
      message: `Rata-rata CAQ ${fmtRp(kpi.avgCAQ)} di atas threshold ${fmtRp(thresholds.alertCaqHigh)}. Perlu optimasi targeting atau creative.`,
      metric: fmtRp(kpi.avgCAQ),
      threshold: fmtRp(thresholds.alertCaqHigh),
    });
  }

  // ── CR alert (overall) ─────────────────────────────────────────────────────
  if (kpi.avgCR < thresholds.alertCrLow) {
    alerts.push({
      type: 'cr_low',
      severity: 'warning',
      title: 'Closing Rate Rendah',
      message: `Rata-rata CR ${kpi.avgCR.toFixed(2)}% di bawah threshold ${thresholds.alertCrLow}%. Cek kualitas lead atau script CS.`,
      metric: `${kpi.avgCR.toFixed(2)}%`,
      threshold: `${thresholds.alertCrLow}%`,
    });
  }

  // ── ADV spend alerts ───────────────────────────────────────────────────────
  if (advSpend.length > 0) {
    const totalSpend = advSpend.reduce((s, a) => s + a.budgetAktual, 0);
    const avgSpend = totalSpend / advSpend.length;
    for (const adv of advSpend.slice(-3)) {
      if (adv.budgetAktual > avgSpend * 1.5) {
        alerts.push({
          type: 'budget_over',
          severity: 'warning',
          title: `Spend Tinggi: ${adv.adv}`,
          message: `Budget aktual ${adv.adv} (${fmtRp(adv.budgetAktual)}) jauh di atas rata-rata ${fmtRp(avgSpend)}. Cek efisiensinya.`,
          metric: fmtRp(adv.budgetAktual),
          threshold: fmtRp(avgSpend * 1.5),
        });
      }
    }
  }

  // ── CS low CR alerts ───────────────────────────────────────────────────────
  if (dashboardCS.length > 0) {
    const teamAvgCR = dashboardCS.reduce((s, c) => s + c.crCS, 0) / dashboardCS.length;
    for (const cs of dashboardCS) {
      if (cs.crCS < teamAvgCR * 0.7) {
        alerts.push({
          type: 'cs_cr_low',
          severity: 'warning',
          title: `CR Rendah: ${cs.cs}`,
          message: `CR ${cs.cs} (${cs.crCS.toFixed(2)}%) jauh di bawah rata-rata tim (${teamAvgCR.toFixed(2)}%). Perlu coaching atau review script.`,
          metric: `${cs.crCS.toFixed(2)}%`,
          threshold: `${(teamAvgCR * 0.7).toFixed(2)}%`,
        });
      }
    }
  }

  // ── ADV high CAQ alerts ────────────────────────────────────────────────────
  if (advData.length > 0) {
    const avgCaq = advData.reduce((s, a) => s + a.caq, 0) / advData.length;
    for (const adv of advData) {
      if (adv.caq > avgCaq * 1.3) {
        alerts.push({
          type: 'adv_caq_high',
          severity: 'info',
          title: `CAQ Tinggi: ${adv.adv}`,
          message: `CAQ ${adv.adv} (${fmtRp(adv.caq)}) di atas rata-rata tim (${fmtRp(avgCaq)}). Review targeting dan creative.`,
          metric: fmtRp(adv.caq),
          threshold: fmtRp(avgCaq * 1.3),
        });
      }
    }
  }

  // ── Retur rate alert ───────────────────────────────────────────────────────
  if (returItems && returItems.length > 0 && totalOrders && totalOrders > 0) {
    const totalRetur = returItems.reduce((s, r) => s + r.jumlah, 0);
    const returRate = (totalRetur / totalOrders) * 100;
    if (returRate > thresholds.alertReturRateHigh) {
      alerts.push({
        type: 'retur_high',
        severity: 'warning',
        title: 'Retur Rate Tinggi',
        message: `Retur rate ${returRate.toFixed(2)}% di atas threshold ${thresholds.alertReturRateHigh}%. ${totalRetur} retur dari ${totalOrders} order. Cek kualitas produk atau CS handling.`,
        metric: `${returRate.toFixed(2)}%`,
        threshold: `${thresholds.alertReturRateHigh}%`,
      });
    }
  }

  // ── Growth trend ───────────────────────────────────────────────────────────
  // If we have at least 7 days of data, check trend
  // (omitted for simplicity, can be added later)

  return alerts;
}
