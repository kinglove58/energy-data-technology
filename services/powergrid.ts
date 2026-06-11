import type { ApiResponse } from "@/types/api";
import type {
  DatasetCatalogResponse,
  LiveAnalysisJobRequest,
  LiveAnalysisJobResponse,
  LiveAnalysisJobStatusResponse,
  LiveAnalysisResultsResponse,
  PowergridMonitoringStatus,
  PowergridReadinessStatus,
  RealtimeGenerationRequest,
  RealtimeGenerationResponse,
} from "@/types/powergrid";

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    return {
      success: false,
      data: null,
      message: `Request failed with status ${response.status}`,
    };
  }

  return payload;
}

async function fetchPowergrid<T>(
  endpoint: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  return parseApiResponse<T>(response);
}

export async function requirePowergridData<T>(
  request: Promise<ApiResponse<T>>
): Promise<T> {
  const response = await request;
  if (!response.success || !response.data) {
    throw new Error(response.message || "Powergrid request failed.");
  }
  return response.data;
}

export async function fetchLatestLiveResults(): Promise<
  ApiResponse<LiveAnalysisResultsResponse>
> {
  return fetchPowergrid<LiveAnalysisResultsResponse>(
    "/api/powergrid/latest-results"
  );
}

export async function fetchPowergridMonitoringStatus(
  includeDrift = false
): Promise<ApiResponse<PowergridMonitoringStatus>> {
  return fetchPowergrid<PowergridMonitoringStatus>(
    `/api/powergrid/monitoring/status?include_drift=${includeDrift}`
  );
}

export async function fetchPowergridReadiness(): Promise<
  ApiResponse<PowergridReadinessStatus>
> {
  return fetchPowergrid<PowergridReadinessStatus>("/api/powergrid/health");
}

export async function fetchDatasetCatalog(): Promise<
  ApiResponse<DatasetCatalogResponse>
> {
  return fetchPowergrid<DatasetCatalogResponse>(
    "/api/powergrid/datasets/catalog"
  );
}

export async function submitLiveAnalysisJob(
  payload: LiveAnalysisJobRequest = {
    persist_results: true,
    generate_if_empty: true,
  }
): Promise<ApiResponse<LiveAnalysisJobResponse>> {
  return fetchPowergrid<LiveAnalysisJobResponse>("/api/powergrid/live/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchLiveAnalysisJobStatus(
  jobId: string
): Promise<ApiResponse<LiveAnalysisJobStatusResponse>> {
  return fetchPowergrid<LiveAnalysisJobStatusResponse>(
    `/api/powergrid/live/jobs/${encodeURIComponent(jobId)}`
  );
}

export async function fetchLiveAnalysisJobResults(
  jobId: string
): Promise<ApiResponse<LiveAnalysisResultsResponse>> {
  return fetchPowergrid<LiveAnalysisResultsResponse>(
    `/api/powergrid/live/jobs/${encodeURIComponent(jobId)}/results`
  );
}

export async function generateRealtimeDataset(
  payload: RealtimeGenerationRequest = {}
): Promise<ApiResponse<RealtimeGenerationResponse>> {
  return fetchPowergrid<RealtimeGenerationResponse>(
    "/api/powergrid/datasets/realtime/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
