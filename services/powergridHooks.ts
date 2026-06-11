"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDatasetCatalog,
  fetchLatestLiveResults,
  fetchLiveAnalysisJobStatus,
  fetchPowergridMonitoringStatus,
  fetchPowergridReadiness,
  generateRealtimeDataset,
  requirePowergridData,
  submitLiveAnalysisJob,
} from "@/services/powergrid";
import type {
  LiveAnalysisJobRequest,
  RealtimeGenerationRequest,
} from "@/types/powergrid";

export const powergridKeys = {
  all: ["powergrid"] as const,
  latestResults: () => [...powergridKeys.all, "latest-results"] as const,
  monitoring: (includeDrift: boolean) =>
    [...powergridKeys.all, "monitoring", includeDrift] as const,
  readiness: () => [...powergridKeys.all, "readiness"] as const,
  datasets: () => [...powergridKeys.all, "datasets"] as const,
  job: (jobId: string | null) => [...powergridKeys.all, "jobs", jobId] as const,
};

export function useLatestLiveResults() {
  return useQuery({
    queryKey: powergridKeys.latestResults(),
    queryFn: () => requirePowergridData(fetchLatestLiveResults()),
    refetchInterval: 60_000,
  });
}

export function usePowergridMonitoringStatus(includeDrift = false) {
  return useQuery({
    queryKey: powergridKeys.monitoring(includeDrift),
    queryFn: () =>
      requirePowergridData(fetchPowergridMonitoringStatus(includeDrift)),
    refetchInterval: 30_000,
  });
}

export function usePowergridReadiness() {
  return useQuery({
    queryKey: powergridKeys.readiness(),
    queryFn: () => requirePowergridData(fetchPowergridReadiness()),
    refetchInterval: 30_000,
  });
}

export function useDatasetCatalog() {
  return useQuery({
    queryKey: powergridKeys.datasets(),
    queryFn: () => requirePowergridData(fetchDatasetCatalog()),
    staleTime: 5 * 60_000,
  });
}

export function useLiveAnalysisJob(jobId: string | null) {
  return useQuery({
    queryKey: powergridKeys.job(jobId),
    queryFn: () =>
      requirePowergridData(fetchLiveAnalysisJobStatus(jobId as string)),
    enabled: Boolean(jobId),
    refetchInterval: (query) =>
      query.state.data?.completed ? false : 5_000,
  });
}

export function useSubmitLiveAnalysisJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: LiveAnalysisJobRequest) =>
      requirePowergridData(submitLiveAnalysisJob(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: powergridKeys.monitoring(false) });
    },
  });
}

export function useGenerateRealtimeDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: RealtimeGenerationRequest) =>
      requirePowergridData(generateRealtimeDataset(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: powergridKeys.monitoring(false) });
      queryClient.invalidateQueries({ queryKey: powergridKeys.latestResults() });
    },
  });
}
