export type MonitorAlert = {
  level: 'warning' | 'critical';
  title: string;
  detail: string;
};

export type MonitorInput = {
  /** Proxy for complaint volume / service pressure */
  waitingPatients: number;
  bedOccupancyPct: number;
  lowStockMedicines: number;
};

export function detectAnomalies(input: MonitorInput): MonitorAlert[] {
  const alerts: MonitorAlert[] = [];

  if (input.bedOccupancyPct > 90) {
    alerts.push({
      level: 'critical',
      title: 'Bed occupancy is critically high',
      detail: `${input.bedOccupancyPct.toFixed(1)}% of beds are occupied or cleaning. Consider surge planning.`,
    });
  }

  if (input.lowStockMedicines >= 5) {
    alerts.push({
      level: 'warning',
      title: 'Unusually many low-stock medicines',
      detail: `${input.lowStockMedicines} SKUs are at or below the low-stock threshold — review procurement.`,
    });
  }

  if (input.waitingPatients >= 25) {
    alerts.push({
      level: 'warning',
      title: 'Heavy queue / complaint pressure',
      detail: `${input.waitingPatients} patients are waiting — monitor departments for recurring medicine or service issues.`,
    });
  }

  return alerts;
}
