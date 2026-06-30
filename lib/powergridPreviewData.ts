import type {
  BypassingHousehold,
  LiveAnalysisResultsResponse,
  LiveGroupAnalysisResult,
  ModelInferenceDetails,
} from "@/types/powergrid";

export const POWERGRID_PREVIEW_JOB_ID = "preview-live-results";
export const POWERGRID_PREVIEW_MESSAGE =
  "Showing a small preview dataset while the Powergrid API is still loading.";

const analyzedAt = "2026-06-30T10:45:00.000Z";

const previewModelDetails: ModelInferenceDetails = {
  model_name: "gnn-power-theft",
  model_version: null,
  artifact_path: null,
  artifact_available: false,
  runtime_ready: false,
  availability_reason: "Frontend preview shown while latest live results are unavailable.",
  inference_strategy: "frontend-preview",
  threshold: 0.6,
  input_channels: null,
  score_source: "preview-heuristic",
  blend_weights: { heuristic: 1 },
};

type PreviewHouseholdInput = Partial<BypassingHousehold> & {
  customer_id: string;
  service_point_id: string;
  node_id: string;
  transformer_id: string;
  feeder_id: string;
  region: string;
  zone: string;
  address: string;
  risk_score: number;
  estimated_loss_kwh: number;
};

function household(input: PreviewHouseholdInput): BypassingHousehold {
  return {
    house_number: null,
    gps_lat: null,
    gps_lon: null,
    inspection_result: "meter_bypass",
    connection_type: "postpaid",
    customer_category: "residential",
    meter_type: "smart",
    recovery_amount: Math.round(input.estimated_loss_kwh * 260),
    heuristic_risk_score: input.risk_score,
    model_risk_score: null,
    predicted_meter_bypass: input.risk_score >= 0.6,
    score_source: "preview-heuristic",
    metadata: { source: "frontend-preview" },
    ...input,
  };
}

function result(
  input: Partial<LiveGroupAnalysisResult> & {
    asset_level: string;
    asset_id: string;
    total_power_delivered_kwh: number;
    total_energy_consumed_kwh: number;
    total_loss_estimate_kwh: number;
    theft_risk_score: number;
  }
): LiveGroupAnalysisResult {
  const bypassingHouseholds = input.bypassing_households ?? [];
  return {
    job_id: POWERGRID_PREVIEW_JOB_ID,
    analyzed_at: analyzedAt,
    region: null,
    zone: null,
    feeder_id: null,
    transformer_id: null,
    customer_id: null,
    service_point_id: null,
    event_count: 1,
    first_observed_at: analyzedAt,
    last_observed_at: analyzedAt,
    heuristic_risk_score: input.theft_risk_score,
    model_risk_score: null,
    anomaly_detected: input.theft_risk_score >= 0.6,
    predicted_meter_bypass: input.theft_risk_score >= 0.6,
    confidence_score: Math.max(input.theft_risk_score, 1 - input.theft_risk_score),
    loss_ratio:
      input.total_power_delivered_kwh > 0
        ? input.total_loss_estimate_kwh / input.total_power_delivered_kwh
        : 0,
    score_source: "preview-heuristic",
    bypassing_household_count: bypassingHouseholds.length,
    bypassing_households: bypassingHouseholds,
    customer_details: {},
    node_context: {
      region: input.region ?? null,
      zone: input.zone ?? null,
      feeder_id: input.feeder_id ?? null,
      transformer_id: input.transformer_id ?? null,
      asset_id: input.asset_id,
      asset_level: input.asset_level,
    },
    model_details: previewModelDetails,
    source_live_db: "frontend_preview",
    source_collection: "preview_rows",
    result_db: "frontend_preview",
    result_collection: "preview_rows",
    ...input,
  };
}

const consumerHouseholds = [
  household({
    customer_id: "CUST-LKI-1001",
    service_point_id: "SP-LKI-1001",
    node_id: "node-lki-1001",
    transformer_id: "TX-LKI-07",
    feeder_id: "FD-LKI-03",
    region: "Lagos Island",
    zone: "Lekki",
    address: "12 Admiralty Way, Lekki Phase 1",
    risk_score: 0.91,
    estimated_loss_kwh: 820,
  }),
  household({
    customer_id: "CUST-IKJ-2044",
    service_point_id: "SP-IKJ-2044",
    node_id: "node-ikj-2044",
    transformer_id: "TX-IKJ-12",
    feeder_id: "FD-IKJ-02",
    region: "Mainland",
    zone: "Ikeja",
    address: "8 Obafemi Awolowo Way, Ikeja",
    risk_score: 0.84,
    estimated_loss_kwh: 640,
  }),
  household({
    customer_id: "CUST-SUR-3320",
    service_point_id: "SP-SUR-3320",
    node_id: "node-sur-3320",
    transformer_id: "TX-SUR-04",
    feeder_id: "FD-SUR-01",
    region: "Mainland",
    zone: "Surulere",
    address: "31 Bode Thomas Street, Surulere",
    risk_score: 0.76,
    estimated_loss_kwh: 430,
  }),
  household({
    customer_id: "CUST-VI-4412",
    service_point_id: "SP-VI-4412",
    node_id: "node-vi-4412",
    transformer_id: "TX-VI-03",
    feeder_id: "FD-VI-01",
    region: "Lagos Island",
    zone: "Victoria Island",
    address: "19 Ahmadu Bello Way, Victoria Island",
    risk_score: 0.68,
    estimated_loss_kwh: 360,
  }),
];

const consumerResults: LiveGroupAnalysisResult[] = consumerHouseholds.map((item) =>
  result({
    asset_level: "consumer",
    asset_id: item.node_id ?? item.customer_id ?? "preview-consumer",
    region: item.region,
    zone: item.zone,
    feeder_id: item.feeder_id,
    transformer_id: item.transformer_id,
    customer_id: item.customer_id,
    service_point_id: item.service_point_id,
    total_power_delivered_kwh: Math.round((item.estimated_loss_kwh ?? 0) / 0.32),
    total_energy_consumed_kwh:
      Math.round((item.estimated_loss_kwh ?? 0) / 0.32) - (item.estimated_loss_kwh ?? 0),
    total_loss_estimate_kwh: item.estimated_loss_kwh ?? 0,
    theft_risk_score: item.risk_score,
    bypassing_households: [item],
  })
);

const aggregateResults: LiveGroupAnalysisResult[] = [
  result({
    asset_level: "transformer",
    asset_id: "TX-LKI-07",
    transformer_id: "TX-LKI-07",
    feeder_id: "FD-LKI-03",
    region: "Lagos Island",
    zone: "Lekki",
    event_count: 2,
    total_power_delivered_kwh: 2563,
    total_energy_consumed_kwh: 1743,
    total_loss_estimate_kwh: 820,
    theft_risk_score: 0.91,
    bypassing_households: [consumerHouseholds[0]],
  }),
  result({
    asset_level: "transformer",
    asset_id: "TX-IKJ-12",
    transformer_id: "TX-IKJ-12",
    feeder_id: "FD-IKJ-02",
    region: "Mainland",
    zone: "Ikeja",
    event_count: 2,
    total_power_delivered_kwh: 2000,
    total_energy_consumed_kwh: 1360,
    total_loss_estimate_kwh: 640,
    theft_risk_score: 0.84,
    bypassing_households: [consumerHouseholds[1]],
  }),
  result({
    asset_level: "feeder",
    asset_id: "FD-LKI-03",
    feeder_id: "FD-LKI-03",
    region: "Lagos Island",
    zone: "Lekki",
    event_count: 4,
    total_power_delivered_kwh: 3688,
    total_energy_consumed_kwh: 2508,
    total_loss_estimate_kwh: 1180,
    theft_risk_score: 0.86,
    bypassing_households: [consumerHouseholds[0], consumerHouseholds[3]],
  }),
  result({
    asset_level: "feeder",
    asset_id: "FD-IKJ-02",
    feeder_id: "FD-IKJ-02",
    region: "Mainland",
    zone: "Ikeja",
    event_count: 3,
    total_power_delivered_kwh: 3344,
    total_energy_consumed_kwh: 2274,
    total_loss_estimate_kwh: 1070,
    theft_risk_score: 0.81,
    bypassing_households: [consumerHouseholds[1], consumerHouseholds[2]],
  }),
  result({
    asset_level: "region",
    asset_id: "REGION::LAGOS_ISLAND",
    region: "Lagos Island",
    zone: null,
    event_count: 6,
    total_power_delivered_kwh: 3688,
    total_energy_consumed_kwh: 2508,
    total_loss_estimate_kwh: 1180,
    theft_risk_score: 0.86,
    bypassing_households: [consumerHouseholds[0], consumerHouseholds[3]],
  }),
  result({
    asset_level: "region",
    asset_id: "REGION::MAINLAND",
    region: "Mainland",
    zone: null,
    event_count: 5,
    total_power_delivered_kwh: 3344,
    total_energy_consumed_kwh: 2274,
    total_loss_estimate_kwh: 1070,
    theft_risk_score: 0.81,
    bypassing_households: [consumerHouseholds[1], consumerHouseholds[2]],
  }),
];

export const POWERGRID_PREVIEW_RESULTS: LiveAnalysisResultsResponse = {
  job_id: POWERGRID_PREVIEW_JOB_ID,
  result_db: "frontend_preview",
  result_collection: "preview_rows",
  result_count: consumerResults.length + aggregateResults.length,
  results: [...consumerResults, ...aggregateResults],
};

export function isPreviewPowergridPayload(
  payload: LiveAnalysisResultsResponse | null | undefined
) {
  return payload?.job_id === POWERGRID_PREVIEW_JOB_ID;
}
