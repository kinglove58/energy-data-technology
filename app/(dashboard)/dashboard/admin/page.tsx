"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  powergridKeys,
  useDatasetCatalog,
  useLiveAnalysisJob,
  usePowergridMonitoringStatus,
  usePowergridReadiness,
  useSubmitLiveAnalysisJob,
} from "@/services/powergridHooks";
import { formatKwh } from "@/lib/powergridAnalytics";

const statusTone = {
  ok: "border-primary/40 bg-primary/10 text-primary",
  degraded: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  down: "border-red-400/40 bg-red-400/10 text-red-300",
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const readiness = usePowergridReadiness();
  const monitoring = usePowergridMonitoringStatus(false);
  const datasets = useDatasetCatalog();
  const submitJob = useSubmitLiveAnalysisJob();
  const job = useLiveAnalysisJob(jobId);

  useEffect(() => {
    if (job.data?.completed) {
      queryClient.invalidateQueries({ queryKey: powergridKeys.latestResults() });
      queryClient.invalidateQueries({ queryKey: powergridKeys.monitoring(false) });
    }
  }, [job.data?.completed, queryClient]);

  const backendStatus = readiness.data?.status ?? monitoring.data?.status ?? "unknown";
  const dependencies = monitoring.data?.dependencies ?? {};
  const counts = monitoring.data?.live_event_counts ?? {};
  const model = monitoring.data?.model_status;
  const datasetRows = datasets.data?.datasets ?? [];
  const availableDatasets = datasetRows.filter((dataset) => dataset.exists).length;

  const handleRunAnalysis = async () => {
    const response = await submitJob.mutateAsync({
      persist_results: true,
      generate_if_empty: true,
    });
    setJobId(response.job_id);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1110] p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Platform Control
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Admin Console
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">
              Runtime health, model readiness, dataset availability, and live
              analysis orchestration for the Eko Disco revenue-assurance demo.
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={submitJob.isPending || Boolean(jobId && !job.data?.completed)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            {submitJob.isPending || (jobId && !job.data?.completed)
              ? "Running Analysis"
              : "Run Live Analysis"}
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Backend Readiness"
            value={backendStatus.toUpperCase()}
            detail={readiness.isLoading ? "Checking API readiness" : "FastAPI service"}
            icon="verified"
            tone={backendStatus === "ok" ? "ok" : "degraded"}
          />
          <StatusCard
            title="Model Artifact"
            value={model?.artifact_available ? "Ready" : "Fallback"}
            detail={model?.version ?? model?.reason ?? "Model status pending"}
            icon="model_training"
            tone={model?.artifact_available ? "ok" : "degraded"}
          />
          <StatusCard
            title="Live Events"
            value={formatKwh(
              Object.values(counts).reduce((sum, value) => sum + value, 0)
            )}
            detail={`Node ${counts.node ?? 0} | Transformer ${counts.transformer ?? 0}`}
            icon="bolt"
            tone="ok"
          />
          <StatusCard
            title="Datasets"
            value={`${availableDatasets}/${datasetRows.length || 0}`}
            detail="CSV files available to the backend"
            icon="dataset"
            tone={availableDatasets === datasetRows.length ? "ok" : "degraded"}
          />
        </section>

        {jobId && (
          <section className="rounded-lg border border-border-dark bg-[#111813] p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Live analysis job
                </p>
                <p className="mt-1 text-xs text-text-muted">{jobId}</p>
              </div>
              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                  job.data?.completed
                    ? statusTone.ok
                    : job.data?.error
                      ? statusTone.down
                      : statusTone.degraded
                }`}
              >
                {job.data?.status ?? "POLLING"}
              </span>
            </div>
            {job.data?.error && (
              <p className="mt-3 text-sm text-red-300">{job.data.error}</p>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-lg border border-border-dark bg-[#111813] p-5 xl:col-span-1">
            <h2 className="text-lg font-bold text-white">Dependencies</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(dependencies).map(([name, dependency]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-border-dark bg-black/20 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold capitalize text-white">
                      {name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {dependency.target}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                      dependency.up ? statusTone.ok : statusTone.down
                    }`}
                  >
                    {dependency.up ? "UP" : "DOWN"}
                  </span>
                </div>
              ))}
              {!Object.keys(dependencies).length && (
                <p className="text-sm text-text-muted">
                  Dependency status is loading.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border-dark bg-[#111813] p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Dataset Catalog</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Backend files used for training, live generation, and context.
                </p>
              </div>
              <button
                onClick={() => datasets.refetch()}
                className="rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-text-muted transition-colors hover:border-primary/50 hover:text-white"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border-dark text-xs uppercase text-text-muted">
                  <tr>
                    <th className="py-3 pr-4">Dataset</th>
                    <th className="py-3 pr-4">Collection</th>
                    <th className="py-3 pr-4">Columns</th>
                    <th className="py-3 pr-4">Purpose</th>
                    <th className="py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {datasetRows.map((dataset) => (
                    <tr key={dataset.dataset_name}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-white">
                          {dataset.dataset_name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {dataset.filename}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-text-muted">
                        {dataset.collection_name}
                      </td>
                      <td className="py-3 pr-4 text-text-muted">
                        {dataset.columns.length}
                      </td>
                      <td className="py-3 pr-4 text-text-muted">
                        {[
                          dataset.used_for_training ? "training" : null,
                          dataset.used_for_realtime_generation ? "realtime" : null,
                          dataset.stored_in_historical_db ? "historical" : null,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                            dataset.exists ? statusTone.ok : statusTone.down
                          }`}
                        >
                          {dataset.exists ? "FOUND" : "MISSING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!datasetRows.length && (
                    <tr>
                      <td className="py-6 text-sm text-text-muted" colSpan={5}>
                        Dataset catalog is loading.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
  tone: keyof typeof statusTone;
}) {
  return (
    <div className="rounded-lg border border-border-dark bg-[#111813] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-text-muted">{detail}</p>
        </div>
        <div className={`rounded-lg border p-2 ${statusTone[tone]}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
