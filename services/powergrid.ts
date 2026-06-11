import type { ApiResponse } from "@/types/api";
import type { LiveAnalysisResultsResponse } from "@/types/powergrid";

export async function fetchLatestLiveResults(): Promise<
  ApiResponse<LiveAnalysisResultsResponse>
> {
  const response = await fetch("/api/powergrid/latest-results", {
    cache: "no-store",
  });

  return response.json();
}
