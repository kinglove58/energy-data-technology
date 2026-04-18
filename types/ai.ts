export type InsightType = 'Alert' | 'Anomaly' | 'Trend';

export interface Insight {
  type: InsightType;
  text: string;
  action: string | null;
}

export interface InsightInput {
  metrics?: {
    energySuppliedMWh?: number;
    energyBilledMWh?: number;
    revenueLossUSD?: number;
    theftCases?: number;
    recoveryUSD?: number;
    period?: string;
  };
}

export interface ReportRequest {
  period: string;
  metrics: Record<string, unknown>;
}

export interface ReportResponse {
  markdown: string;
  generatedAt: string;
}
