import type {
  BypassingHousehold,
  LiveAnalysisResultsResponse,
  LiveGroupAnalysisResult,
} from "@/types/powergrid";

export type TheftCase = {
  id: string;
  title: string;
  customerId: string;
  servicePointId: string;
  address: string;
  region: string;
  zone: string;
  feederId: string;
  transformerId: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Active" | "Investigating" | "Scheduled";
  riskScore: number;
  confidenceScore: number;
  lossKwh: number;
  recoveryAmount: number;
  meterType: string;
  connectionType: string;
  customerCategory: string;
  contactName: string;
  contactPhone: string;
  coords: { lat: number; lng: number } | null;
  reason: string;
};

export type PowergridSummary = {
  jobId: string;
  resultCount: number;
  analyzedAt: string | null;
  deliveredKwh: number;
  consumedKwh: number;
  lossKwh: number;
  bypassCaseCount: number;
  averageRisk: number;
  highestRisk: number;
};

export type AssetAggregate = {
  id: string;
  label: string;
  level: string;
  region: string;
  zone: string;
  deliveredKwh: number;
  consumedKwh: number;
  lossKwh: number;
  riskScore: number;
  bypassCount: number;
};

const FALLBACK_PHONE_PREFIX = "+23481607";

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatKwh(value: number) {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function severityFromRisk(
  riskScore: number
): "Critical" | "High" | "Medium" | "Low" {
  if (riskScore >= 0.85) return "Critical";
  if (riskScore >= 0.7) return "High";
  if (riskScore >= 0.55) return "Medium";
  return "Low";
}

export function statusFromRisk(
  riskScore: number
): "Active" | "Investigating" | "Scheduled" {
  if (riskScore >= 0.85) return "Active";
  if (riskScore >= 0.7) return "Investigating";
  return "Scheduled";
}

function valueFromDetails(
  result: LiveGroupAnalysisResult,
  keys: string[],
  fallback = ""
) {
  for (const key of keys) {
    const value = result.customer_details?.[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function householdAddress(
  household: BypassingHousehold,
  result: LiveGroupAnalysisResult
) {
  return (
    household.address ||
    valueFromDetails(result, ["address", "customer_address", "street_address"]) ||
    [household.house_number, household.zone, household.region]
      .filter(Boolean)
      .join(", ") ||
    "Unmapped service point"
  );
}

export function summarizeLiveResults(
  data: LiveAnalysisResultsResponse | undefined
): PowergridSummary {
  const results = data?.results ?? [];
  const consumers = results.filter((result) => result.asset_level === "consumer");
  const bypassCaseCount = consumers.reduce((sum, result) => {
    const confirmedCount = Math.max(
      Number(result.bypassing_household_count || 0),
      result.bypassing_households?.length ?? 0
    );

    if (confirmedCount > 0) return sum + confirmedCount;
    if (
      result.predicted_meter_bypass ||
      result.anomaly_detected ||
      result.theft_risk_score >= 0.6
    ) {
      return sum + 1;
    }

    return sum;
  }, 0);
  const riskTotal = consumers.reduce(
    (sum, result) => sum + result.theft_risk_score,
    0
  );

  return {
    jobId: data?.job_id ?? "",
    resultCount: data?.result_count ?? 0,
    analyzedAt: results[0]?.analyzed_at ?? null,
    deliveredKwh: consumers.reduce(
      (sum, result) => sum + result.total_power_delivered_kwh,
      0
    ),
    consumedKwh: consumers.reduce(
      (sum, result) => sum + result.total_energy_consumed_kwh,
      0
    ),
    lossKwh: consumers.reduce(
      (sum, result) => sum + result.total_loss_estimate_kwh,
      0
    ),
    bypassCaseCount,
    averageRisk: consumers.length ? riskTotal / consumers.length : 0,
    highestRisk: consumers.reduce(
      (max, result) => Math.max(max, result.theft_risk_score),
      0
    ),
  };
}

export function buildTheftCases(
  data: LiveAnalysisResultsResponse | undefined,
  limit = 40
): TheftCase[] {
  const results = data?.results ?? [];
  const consumers = results
    .filter((result) => result.asset_level === "consumer")
    .filter(
      (result) =>
        result.predicted_meter_bypass ||
        result.anomaly_detected ||
        result.theft_risk_score >= 0.6 ||
        result.bypassing_household_count > 0
    )
    .sort((a, b) => b.theft_risk_score - a.theft_risk_score)
    .slice(0, limit);

  return consumers.map((result, index) => {
    const household = result.bypassing_households[0];
    const riskScore = household?.risk_score ?? result.theft_risk_score;
    const severity = severityFromRisk(riskScore);
    const customerId =
      household?.customer_id || result.customer_id || result.asset_id;
    const servicePointId =
      household?.service_point_id || result.service_point_id || result.asset_id;
    const phone =
      valueFromDetails(result, ["phone", "phone_number", "mobile"]) ||
      `${FALLBACK_PHONE_PREFIX}${String(index + 1000).slice(-4)}`;

    return {
      id: `EDN-${String(index + 1).padStart(4, "0")}`,
      title: `${severity} bypass risk`,
      customerId,
      servicePointId,
      address: household ? householdAddress(household, result) : householdAddress({} as BypassingHousehold, result),
      region: household?.region || result.region || "Unknown region",
      zone: household?.zone || result.zone || "Unknown zone",
      feederId: household?.feeder_id || result.feeder_id || "Unknown feeder",
      transformerId:
        household?.transformer_id || result.transformer_id || "Unknown transformer",
      severity,
      status: statusFromRisk(riskScore),
      riskScore,
      confidenceScore: result.confidence_score,
      lossKwh:
        household?.estimated_loss_kwh ?? result.total_loss_estimate_kwh ?? 0,
      recoveryAmount:
        household?.recovery_amount ??
        Math.max(result.total_loss_estimate_kwh * 260, 0),
      meterType: household?.meter_type || "Unknown meter",
      connectionType: household?.connection_type || "Unknown connection",
      customerCategory: household?.customer_category || "Unknown customer",
      contactName:
        valueFromDetails(result, ["customer_name", "name", "account_name"]) ||
        customerId,
      contactPhone: phone,
      coords:
        typeof household?.gps_lat === "number" &&
        typeof household?.gps_lon === "number"
          ? { lat: household.gps_lat, lng: household.gps_lon }
          : null,
      reason:
        result.score_source === "model"
          ? "Model risk score crossed the bypass threshold."
          : "Loss and consumption pattern crossed the bypass threshold.",
    };
  });
}

export function aggregateAssets(
  data: LiveAnalysisResultsResponse | undefined,
  level: "region" | "feeder" | "transformer" = "feeder",
  limit = 12
): AssetAggregate[] {
  return (data?.results ?? [])
    .filter((result) => result.asset_level === level)
    .map((result) => ({
      id: result.asset_id,
      label:
        level === "region"
          ? result.region || result.asset_id
          : level === "feeder"
            ? result.feeder_id || result.asset_id
            : result.transformer_id || result.asset_id,
      level,
      region: result.region || "Unknown region",
      zone: result.zone || "Unknown zone",
      deliveredKwh: result.total_power_delivered_kwh,
      consumedKwh: result.total_energy_consumed_kwh,
      lossKwh: result.total_loss_estimate_kwh,
      riskScore: result.theft_risk_score,
      bypassCount: result.bypassing_household_count,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

export function getModelDetails(data: LiveAnalysisResultsResponse | undefined) {
  return data?.results.find((result) => result.model_details)?.model_details;
}
