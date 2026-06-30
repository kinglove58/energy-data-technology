"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  powergridKeys,
  useLatestLiveResults,
  useLiveAnalysisJob,
  usePowergridMonitoringStatus,
  useSubmitLiveAnalysisJob,
} from "@/services/powergridHooks";
import {
  aggregateAssets,
  buildTheftCases,
  formatKwh,
  formatNaira,
  formatPercent,
  summarizeLiveResults,
} from "@/lib/powergridAnalytics";
import { downloadReportPdf, generateReport } from "@/services/reports";

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const latest = useLatestLiveResults();
  const monitoring = usePowergridMonitoringStatus(false);
  const submitJob = useSubmitLiveAnalysisJob();
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [reportState, setReportState] = useState("Ready");
  const job = useLiveAnalysisJob(jobId);

  const summary = useMemo(() => summarizeLiveResults(latest.data), [latest.data]);
  const topFeeders = useMemo(
    () => aggregateAssets(latest.data, "feeder", 10),
    [latest.data]
  );
  const topTransformers = useMemo(
    () => aggregateAssets(latest.data, "transformer", 8),
    [latest.data]
  );
  const cases = useMemo(() => buildTheftCases(latest.data, 12), [latest.data]);
  const latestErrorMessage =
    latest.error instanceof Error
      ? latest.error.message
      : latest.isError
        ? "Unable to load latest grouped-analysis results."
        : null;

  useEffect(() => {
    if (job.data?.completed) {
      queryClient.invalidateQueries({ queryKey: powergridKeys.latestResults() });
      queryClient.invalidateQueries({ queryKey: powergridKeys.monitoring(false) });
    }
  }, [job.data?.completed, queryClient]);

  const handleRunAnalysis = async () => {
    setJobMessage("Submitting live grouped-analysis job.");
    try {
      const response = await submitJob.mutateAsync({
        persist_results: true,
        generate_if_empty: true,
      });
      setJobId(response.job_id);
      setJobMessage("Live grouped-analysis job queued.");
    } catch (error) {
      setJobMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit live grouped-analysis job."
      );
    }
  };

  const handleGenerateReport = async () => {
    setReportState("Generating");
    const response = await generateReport({
      period: "Latest live analysis batch",
      metrics: {
        energySuppliedMWh: summary.deliveredKwh / 1000,
        energyBilledMWh: summary.consumedKwh / 1000,
        revenueLossUSD: summary.lossKwh * 260,
        theftCases: summary.bypassCaseCount,
        recoveryUSD: cases.reduce((sum, item) => sum + item.recoveryAmount, 0),
      },
    });

    if (!response.success || !response.data?.markdown) {
      setReportState(response.message || "Report failed");
      return;
    }

    const pdf = await downloadReportPdf(
      response.data.markdown,
      "Eko Disco Revenue Assurance Report"
    );
    const url = URL.createObjectURL(pdf);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eko-disco-revenue-assurance-report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setReportState("Ready");
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1110] p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Analytics & Reports
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Revenue Assurance Analytics
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-text-muted">
              Aggregated loss, bypass-risk, feeder, and transformer intelligence
              from the latest backend grouped-analysis run.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRunAnalysis}
              disabled={submitJob.isPending || Boolean(jobId && !job.data?.completed)}
              className="inline-flex items-center gap-2 rounded-lg border border-border-dark px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              {submitJob.isPending || (jobId && !job.data?.completed)
                ? "Running"
                : "Run Analysis"}
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={
                reportState === "Generating" ||
                !latest.data ||
                summary.resultCount === 0
              }
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              {reportState === "Generating" ? "Generating" : "Export Report"}
            </button>
          </div>
        </header>

        {jobId && (
          <div className="rounded-lg border border-border-dark bg-[#111813] px-4 py-3 text-sm text-text-muted">
            Job <span className="font-mono text-white">{jobId}</span> status:{" "}
            <span className="font-bold text-primary">
              {job.data?.status ?? "POLLING"}
            </span>
          </div>
        )}

        {(latestErrorMessage || jobMessage) && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {latestErrorMessage ? (
              <p>
                Latest grouped-analysis unavailable:{" "}
                <span className="font-semibold">{latestErrorMessage}</span>
              </p>
            ) : null}
            {jobMessage ? <p>{jobMessage}</p> : null}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric title="Result Groups" value={String(summary.resultCount)} />
          <Metric title="Bypass Cases" value={String(summary.bypassCaseCount)} />
          <Metric title="Avg Risk" value={formatPercent(summary.averageRisk)} />
          <Metric title="Loss Estimate" value={`${formatKwh(summary.lossKwh)} kWh`} />
          <Metric
            title="Revenue Exposure"
            value={formatNaira(summary.lossKwh * 260)}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-lg border border-border-dark bg-[#111813] p-5 xl:col-span-2">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">
                Feeder Loss & Risk Ranking
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                Top feeders by theft-risk score from live grouped analysis.
              </p>
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFeeders}>
                  <CartesianGrid stroke="#28392e" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#9db9a6", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9db9a6", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111813",
                      border: "1px solid #28392e",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="riskScore" name="Risk Score" fill="#11d452" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bypassCount" name="Flagged Households" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border-dark bg-[#111813] p-5">
            <h2 className="text-lg font-bold text-white">Runtime Snapshot</h2>
            <div className="mt-4 space-y-3">
              <Snapshot
                label="Backend"
                value={monitoring.data?.status?.toUpperCase() ?? "LOADING"}
              />
              <Snapshot
                label="Model"
                value={monitoring.data?.model_status?.version ?? "Fallback"}
              />
              <Snapshot
                label="Live Node Events"
                value={String(monitoring.data?.live_event_counts?.node ?? 0)}
              />
              <Snapshot
                label="Job"
                value={job.data?.completed ? "Completed" : jobId ? "Running" : "Idle"}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-border-dark bg-[#111813] p-5">
            <h2 className="text-lg font-bold text-white">
              Transformer Watchlist
            </h2>
            <div className="mt-4 space-y-3">
              {topTransformers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border-dark bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.zone} | {item.region}
                      </p>
                    </div>
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                      {formatPercent(item.riskScore)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className="text-text-muted">
                      Loss <b className="text-white">{formatKwh(item.lossKwh)}</b>
                    </span>
                    <span className="text-text-muted">
                      Cases <b className="text-white">{item.bypassCount}</b>
                    </span>
                    <span className="text-text-muted">
                      Supplied{" "}
                      <b className="text-white">{formatKwh(item.deliveredKwh)}</b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border-dark bg-[#111813] p-5">
            <h2 className="text-lg font-bold text-white">
              Priority Theft Cases
            </h2>
            <div className="mt-4 space-y-3">
              {cases.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border-dark bg-black/20 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{item.address}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.feederId} | {formatKwh(item.lossKwh)} kWh
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs font-bold text-red-300">
                    {formatPercent(item.riskScore)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-dark bg-[#111813] p-4">
      <p className="text-xs font-bold uppercase text-text-muted">{title}</p>
      <p className="mt-2 break-words text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border-dark bg-black/20 px-3 py-3">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="max-w-[190px] truncate text-right text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}
