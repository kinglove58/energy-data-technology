export type ModelInferenceDetails = {
  model_name: string;
  model_version: string | null;
  artifact_path: string | null;
  artifact_available: boolean;
  runtime_ready: boolean;
  availability_reason: string | null;
  inference_strategy: string;
  threshold: number;
  input_channels: number | null;
  score_source: string | null;
  blend_weights: Record<string, number> | null;
};

export type BypassingHousehold = {
  customer_id: string | null;
  service_point_id: string | null;
  node_id: string | null;
  transformer_id: string | null;
  feeder_id: string | null;
  region: string | null;
  zone: string | null;
  house_number: string | null;
  address: string | null;
  gps_lat: number | null;
  gps_lon: number | null;
  inspection_result: string | null;
  connection_type: string | null;
  customer_category: string | null;
  meter_type: string | null;
  recovery_amount: number | null;
  estimated_loss_kwh: number | null;
  risk_score: number;
  heuristic_risk_score: number;
  model_risk_score: number | null;
  predicted_meter_bypass: boolean;
  score_source: string;
  metadata: Record<string, unknown>;
};

export type LiveGroupAnalysisResult = {
  job_id: string;
  analyzed_at: string;
  asset_level: string;
  asset_id: string;
  region: string | null;
  zone: string | null;
  feeder_id: string | null;
  transformer_id: string | null;
  customer_id: string | null;
  service_point_id: string | null;
  event_count: number;
  first_observed_at: string | null;
  last_observed_at: string | null;
  total_power_delivered_kwh: number;
  total_energy_consumed_kwh: number;
  total_loss_estimate_kwh: number;
  theft_risk_score: number;
  heuristic_risk_score: number;
  model_risk_score: number | null;
  anomaly_detected: boolean;
  predicted_meter_bypass: boolean;
  confidence_score: number;
  loss_ratio: number;
  score_source: string;
  bypassing_household_count: number;
  bypassing_households: BypassingHousehold[];
  customer_details: Record<string, unknown>;
  node_context: Record<string, string | null>;
  model_details: ModelInferenceDetails;
  source_live_db: string;
  source_collection: string;
  result_db: string;
  result_collection: string;
};

export type LiveAnalysisResultsResponse = {
  job_id: string;
  result_db: string;
  result_collection: string;
  result_count: number;
  results: LiveGroupAnalysisResult[];
};

export type PowergridDependencyStatus = {
  up: boolean;
  target: string;
  details: string;
};

export type PowergridModelStatus = {
  model_name: string;
  version: string | null;
  artifact_dir: string | null;
  artifact_available: boolean;
  reason: string | null;
};

export type PowergridMonitoringStatus = {
  status: string;
  generated_at: string;
  app_name: string;
  app_env: string;
  dependencies: Record<string, PowergridDependencyStatus>;
  model_status: PowergridModelStatus;
  model_details?: ModelInferenceDetails;
  live_event_counts: Record<string, number>;
  drift_report: unknown | null;
  metrics: {
    enabled: boolean;
    endpoint: string;
  };
};

export type PowergridReadinessStatus = PowergridMonitoringStatus & {
  status: "ok" | "degraded" | string;
};

export type DatasetFileInfo = {
  dataset_name: string;
  filename: string;
  collection_name: string;
  path: string;
  exists: boolean;
  file_size_bytes: number | null;
  columns: string[];
  used_for_training: boolean;
  stored_in_historical_db: boolean;
  used_for_realtime_generation: boolean;
};

export type DatasetCatalogResponse = {
  datasets: DatasetFileInfo[];
};

export type LiveAnalysisJobRequest = {
  model_version?: string | null;
  persist_results?: boolean;
  generate_if_empty?: boolean;
  node_event_count?: number | null;
  feeder_event_count?: number | null;
};

export type LiveAnalysisJobResponse = {
  job_id: string;
  task_id: string;
  status: string;
  submitted_at: string;
  source_live_db: string;
  result_db: string;
  result_collection: string;
};

export type LiveAnalysisJobStatusResponse = {
  job_id: string;
  status: string;
  completed: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
};

export type RealtimeGenerationRequest = {
  node_event_count?: number | null;
  feeder_event_count?: number | null;
};

export type RealtimeGenerationResponse = {
  generated_at: string;
  realtime_db: string;
  node_event_count: number;
  transformer_event_count: number;
  feeder_event_count: number;
  region_event_count: number;
  stored_collections: string[];
  published_topics: string[];
  generated_events: unknown[];
};
