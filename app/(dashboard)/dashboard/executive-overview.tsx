"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
  BarChart3,
  Bolt,
  BrainCircuit,
  Download,
  FileText,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { fetchInsights } from "@/services/insights";
import {
  isPreviewPowergridPayload,
  POWERGRID_PREVIEW_MESSAGE,
} from "@/lib/powergridPreviewData";
import { useLatestLiveResults } from "@/services/powergridHooks";
import { downloadReportPdf, generateReport } from "@/services/reports";
import type { Insight } from "@/types/ai";
import type {
  LiveAnalysisResultsResponse,
  LiveGroupAnalysisResult,
} from "@/types/powergrid";

type LoadState = "loading" | "ready" | "empty" | "error";

type DashboardSummary = {
  deliveredKwh: number;
  consumedKwh: number;
  lossKwh: number;
  lossRatio: number;
  flaggedConsumers: number;
  highRiskConsumers: number;
  averageRisk: number;
  averageConfidence: number;
  eventCount: number;
  aggregateLevel: string;
};

const FALLBACK_INSIGHTS: Insight[] = [
  {
    type: "Alert",
    text: "No live grouped-analysis result is available yet. Start the backend cycle and refresh this dashboard.",
    action: null,
  },
  {
    type: "Trend",
    text: "Once `/analysis/live/results/latest` returns data, this panel will summarize the latest risk drivers.",
    action: null,
  },
];

const PREVIEW_INSIGHTS: Insight[] = [
  {
    type: "Trend",
    text: "Preview rows are visible while the backend latest-results endpoint finishes loading.",
    action: "Real grouped-analysis results will replace this preview automatically.",
  },
  {
    type: "Alert",
    text: "The deployed backend is reachable, but latest live analysis is not returning fast enough yet.",
    action: "Refresh after the backend worker or snapshot fallback is deployed.",
  },
];

const RISK_CLASSES = {
  critical: "border-red-500/30 bg-red-500/10 text-red-200",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  normal: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
};

function normalizeLevel(level: string) {
  return level.toLowerCase().trim();
}

function levelMatches(result: LiveGroupAnalysisResult, level: string) {
  const normalized = normalizeLevel(result.asset_level);
  if (level === "consumer") {
    return normalized === "consumer" || normalized === "node";
  }
  return normalized === level;
}

function selectAggregateResults(results: LiveGroupAnalysisResult[]) {
  for (const level of ["region", "feeder", "transformer", "consumer"]) {
    const matches = results.filter((result) => levelMatches(result, level));
    if (matches.length) {
      return { level, results: matches };
    }
  }
  return { level: "result", results };
}

function sumBy(
  results: LiveGroupAnalysisResult[],
  field: keyof Pick<
    LiveGroupAnalysisResult,
    | "event_count"
    | "total_power_delivered_kwh"
    | "total_energy_consumed_kwh"
    | "total_loss_estimate_kwh"
  >
) {
  return results.reduce((sum, result) => sum + Number(result[field] || 0), 0);
}

function averageBy(
  results: LiveGroupAnalysisResult[],
  field: keyof Pick<
    LiveGroupAnalysisResult,
    "theft_risk_score" | "confidence_score"
  >
) {
  if (!results.length) return 0;
  return (
    results.reduce((sum, result) => sum + Number(result[field] || 0), 0) /
    results.length
  );
}

function summarizeResults(
  payload: LiveAnalysisResultsResponse | null
): DashboardSummary {
  const allResults = payload?.results ?? [];
  const aggregate = selectAggregateResults(allResults);
  const consumerResults = allResults.filter((result) =>
    levelMatches(result, "consumer")
  );
  const deliveredKwh = sumBy(aggregate.results, "total_power_delivered_kwh");
  const consumedKwh = sumBy(aggregate.results, "total_energy_consumed_kwh");
  const lossKwh = sumBy(aggregate.results, "total_loss_estimate_kwh");
  const flaggedConsumers = consumerResults.filter(
    (result) => result.predicted_meter_bypass || result.anomaly_detected
  ).length;
  const highRiskConsumers = consumerResults.filter(
    (result) => Number(result.theft_risk_score || 0) >= 0.7
  ).length;

  return {
    deliveredKwh,
    consumedKwh,
    lossKwh,
    lossRatio: deliveredKwh > 0 ? lossKwh / deliveredKwh : 0,
    flaggedConsumers,
    highRiskConsumers,
    averageRisk: averageBy(consumerResults.length ? consumerResults : allResults, "theft_risk_score"),
    averageConfidence: averageBy(allResults, "confidence_score"),
    eventCount: sumBy(aggregate.results, "event_count"),
    aggregateLevel: aggregate.level,
  };
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function formatEnergy(kwh: number) {
  if (!Number.isFinite(kwh)) return "0 kWh";
  const abs = Math.abs(kwh);
  if (abs >= 1_000_000) return `${(kwh / 1_000_000).toFixed(2)} GWh`;
  if (abs >= 1_000) return `${(kwh / 1_000).toFixed(2)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}

function formatMoneyFromLoss(kwh: number) {
  const estimatedUsd = kwh * 0.16;
  if (estimatedUsd >= 1_000_000) return `$${(estimatedUsd / 1_000_000).toFixed(2)}M`;
  if (estimatedUsd >= 1_000) return `$${(estimatedUsd / 1_000).toFixed(1)}k`;
  return `$${estimatedUsd.toFixed(0)}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskBand(score: number) {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.45) return "medium";
  return "normal";
}

function getRegionRows(results: LiveGroupAnalysisResult[]) {
  const regionResults = results.filter((result) => levelMatches(result, "region"));
  const source = regionResults.length
    ? regionResults
    : results.filter((result) => levelMatches(result, "feeder")).slice(0, 8);

  return source
    .map((result) => ({
      name: result.region || result.asset_id,
      delivered: Number((result.total_power_delivered_kwh / 1_000).toFixed(2)),
      consumed: Number((result.total_energy_consumed_kwh / 1_000).toFixed(2)),
      loss: Number((result.total_loss_estimate_kwh / 1_000).toFixed(2)),
      risk: result.theft_risk_score,
    }))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 8);
}

function getTopCases(results: LiveGroupAnalysisResult[]) {
  return results
    .filter((result) => levelMatches(result, "consumer"))
    .sort((a, b) => {
      const riskDelta = b.theft_risk_score - a.theft_risk_score;
      if (riskDelta !== 0) return riskDelta;
      return b.total_loss_estimate_kwh - a.total_loss_estimate_kwh;
    })
    .slice(0, 8);
}

function getLatestAnalyzedAt(results: LiveGroupAnalysisResult[]) {
  return results
    .map((result) => result.analyzed_at)
    .sort()
    .at(-1);
}

function getModelDetails(results: LiveGroupAnalysisResult[]) {
  return results.find((result) => result.model_details)?.model_details ?? null;
}

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "risk" | "success" | "warning";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-[#101a17] text-emerald-300",
    risk: "border-red-500/25 bg-red-500/10 text-red-300",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  }[tone];

  return (
    <section className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-400">
            {title}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{detail}</p>
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone: keyof typeof RISK_CLASSES }) {
  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${RISK_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

function EmptyState({
  state,
  message,
  onRefresh,
}: {
  state: LoadState;
  message: string;
  onRefresh: () => void;
}) {
  const isLoading = state === "loading";

  return (
    <div className="flex min-h-[520px] items-center justify-center bg-[#0b1110] p-6">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#101a17] p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
          {isLoading ? (
            <RefreshCw className="h-6 w-6 animate-spin" />
          ) : (
            <AlertTriangle className="h-6 w-6" />
          )}
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">
          {isLoading ? "Loading live analysis" : "No live analysis to show"}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">{message}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary-hover"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>
  );
}

const InsightItem = ({ text, action, type }: Insight) => (
  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
    <p className="text-sm leading-snug text-slate-200">
      <span
        className={
          type === "Alert"
            ? "font-bold text-red-300"
            : type === "Anomaly"
              ? "font-bold text-amber-200"
              : "font-bold text-emerald-300"
        }
      >
        {type}:
      </span>{" "}
      {text}
    </p>
    {action && (
      <p className="mt-2 text-xs font-semibold text-emerald-300">{action}</p>
    )}
  </div>
);

export default function ExecutiveOverview() {
  const latestQuery = useLatestLiveResults();
  const [payload, setPayload] = useState<LiveAnalysisResultsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("Connecting to the Powergrid API.");
  const [insights, setInsights] = useState<Insight[]>(FALLBACK_INSIGHTS);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const results = payload?.results ?? [];
  const summary = useMemo(() => summarizeResults(payload), [payload]);
  const regionRows = useMemo(() => getRegionRows(results), [results]);
  const topCases = useMemo(() => getTopCases(results), [results]);
  const modelDetails = useMemo(() => getModelDetails(results), [results]);
  const latestAnalyzedAt = useMemo(() => getLatestAnalyzedAt(results), [results]);
  const showingPreview = isPreviewPowergridPayload(payload);

  const loadResults = () => {
    setState("loading");
    setMessage("Connecting to the Powergrid API.");
    latestQuery.refetch();
  };

  useEffect(() => {
    if (latestQuery.data && latestQuery.data.result_count > 0) {
      setPayload(latestQuery.data);
      setState("ready");
      setMessage(
        isPreviewPowergridPayload(latestQuery.data)
          ? POWERGRID_PREVIEW_MESSAGE
          : "Latest grouped-analysis results loaded."
      );
      return;
    }

    if (latestQuery.isLoading) {
      setState("loading");
      setMessage("Connecting to the Powergrid API.");
      return;
    }

    if (latestQuery.isError) {
      setPayload(null);
      setState("error");
      setMessage(
        latestQuery.error instanceof Error
          ? latestQuery.error.message
          : "Unable to load latest grouped-analysis results."
      );
      return;
    }

    setPayload(null);
    setState("empty");
    setMessage("No stored grouped-analysis results found yet.");
  }, [
    latestQuery.data,
    latestQuery.error,
    latestQuery.isError,
    latestQuery.isLoading,
  ]);

  useEffect(() => {
    if (state !== "ready" || !payload) return;

    if (isPreviewPowergridPayload(payload)) {
      setInsights(PREVIEW_INSIGHTS);
      return;
    }

    async function loadInsights() {
      setIsLoadingInsights(true);
      try {
        const response = await fetchInsights({
          metrics: {
            energySuppliedMWh: Number((summary.deliveredKwh / 1_000).toFixed(2)),
            energyBilledMWh: Number((summary.consumedKwh / 1_000).toFixed(2)),
            revenueLossUSD: Number((summary.lossKwh * 0.16).toFixed(0)),
            theftCases: summary.flaggedConsumers,
            recoveryUSD: 0,
            period: "Latest live batch",
          },
        });
        setInsights(response.success && response.data ? response.data : FALLBACK_INSIGHTS);
      } catch {
        setInsights(FALLBACK_INSIGHTS);
      } finally {
        setIsLoadingInsights(false);
      }
    }

    loadInsights();
  }, [payload, state, summary.consumedKwh, summary.deliveredKwh, summary.flaggedConsumers, summary.lossKwh]);

  const handleGenerateFullReport = async () => {
    setShowReportModal(true);
    setReportContent("");
    setIsGeneratingReport(true);

    try {
      const response = await generateReport({
        period: "Latest live grouped-analysis batch",
        metrics: {
          jobId: payload?.job_id,
          resultCount: payload?.result_count,
          deliveredKwh: summary.deliveredKwh,
          consumedKwh: summary.consumedKwh,
          lossKwh: summary.lossKwh,
          lossRatio: summary.lossRatio,
          flaggedConsumers: summary.flaggedConsumers,
          highRiskConsumers: summary.highRiskConsumers,
          averageRisk: summary.averageRisk,
          modelStrategy: modelDetails?.inference_strategy,
        },
      });

      setReportContent(
        response.success && response.data
          ? response.data.markdown
          : "## Unable to generate report\nPlease try again."
      );
    } catch {
      setReportContent(
        "## Error Generating Report\nUnable to connect to the AI report service. Please try again later."
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportContent) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadReportPdf(reportContent, "Powergrid Executive Report");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "powergrid-executive-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (state !== "ready") {
    return <EmptyState state={state} message={message} onRefresh={loadResults} />;
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1110] p-5 pb-20 lg:p-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={showingPreview ? "Preview data" : "Live API"}
                tone={showingPreview ? "medium" : "normal"}
              />
              <StatusPill
                label={modelDetails?.artifact_available ? "Model artifact" : "Heuristic fallback"}
                tone={modelDetails?.artifact_available ? "normal" : "medium"}
              />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white">
              Powergrid Revenue Assurance
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Latest job {payload?.job_id.slice(0, 10)} · analyzed {formatDateTime(latestAnalyzedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadResults}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleGenerateFullReport}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-bold text-black hover:bg-primary-hover"
            >
              <FileText className="h-4 w-4" />
              Executive report
            </button>
          </div>
        </header>

        {showingPreview && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            title="Delivered"
            value={formatEnergy(summary.deliveredKwh)}
            detail={`${summary.eventCount.toLocaleString()} events at ${summary.aggregateLevel} level`}
            icon={Bolt}
            tone="neutral"
          />
          <KpiCard
            title="Consumed"
            value={formatEnergy(summary.consumedKwh)}
            detail="Customer-side energy observed"
            icon={BarChart3}
            tone="success"
          />
          <KpiCard
            title="Loss Estimate"
            value={formatEnergy(summary.lossKwh)}
            detail={`${formatPercent(summary.lossRatio)} of delivered energy`}
            icon={ShieldAlert}
            tone="risk"
          />
          <KpiCard
            title="Revenue Exposure"
            value={formatMoneyFromLoss(summary.lossKwh)}
            detail="Estimated at $0.16/kWh"
            icon={WalletCards}
            tone="warning"
          />
          <KpiCard
            title="Bypass Flags"
            value={summary.flaggedConsumers.toLocaleString()}
            detail={`${summary.highRiskConsumers.toLocaleString()} high-risk consumers`}
            icon={AlertTriangle}
            tone="risk"
          />
          <KpiCard
            title="Average Risk"
            value={formatPercent(summary.averageRisk)}
            detail={`${formatPercent(summary.averageConfidence)} avg confidence`}
            icon={TrendingUp}
            tone="neutral"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-lg border border-white/10 bg-[#101a17] p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Regional Energy Balance</h2>
                <p className="text-sm text-slate-400">
                  Supplied, consumed, and estimated loss by latest aggregate group.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">MWh</span>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionRows} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#203028" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#9db9a6", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9db9a6", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      backgroundColor: "#101a17",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="delivered" name="Delivered" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consumed" name="Consumed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loss" name="Loss" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-[#101a17] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className={`h-5 w-5 text-primary ${isLoadingInsights ? "animate-pulse" : ""}`} />
                <h2 className="text-lg font-bold text-white">Analysis Notes</h2>
              </div>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                Latest
              </span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {insights.map((insight, index) => (
                <InsightItem key={`${insight.type}-${index}`} {...insight} />
              ))}
            </div>
            <div className="border-t border-white/10 p-4 text-xs text-slate-400">
              Model strategy:{" "}
              <span className="font-semibold text-slate-200">
                {modelDetails?.inference_strategy ?? "Not reported"}
              </span>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-lg border border-white/10 bg-[#101a17] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h2 className="text-lg font-bold text-white">Top Suspected Bypass Cases</h2>
                <p className="text-sm text-slate-400">Consumer-level results ranked by risk and loss.</p>
              </div>
              <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300">
                {topCases.length} shown
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Consumer</th>
                    <th className="px-4 py-3 font-semibold">Network</th>
                    <th className="px-4 py-3 font-semibold">Risk</th>
                    <th className="px-4 py-3 font-semibold">Loss</th>
                    <th className="px-4 py-3 font-semibold">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {topCases.map((result) => {
                    const riskBand = getRiskBand(result.theft_risk_score);
                    return (
                      <tr key={`${result.job_id}-${result.asset_id}`} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">
                            {result.customer_id || result.asset_id}
                          </p>
                          <p className="text-xs text-slate-500">
                            {result.service_point_id || "No service point"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <p>{result.region || "Unknown region"}</p>
                          <p className="text-xs text-slate-500">
                            {result.feeder_id || "No feeder"} · {result.transformer_id || "No transformer"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill label={formatPercent(result.theft_risk_score)} tone={riskBand} />
                        </td>
                        <td className="px-4 py-3 font-semibold text-orange-200">
                          {formatEnergy(result.total_loss_estimate_kwh)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <p>{result.score_source}</p>
                          <p className="text-xs text-slate-500">
                            {result.predicted_meter_bypass ? "Predicted bypass" : "Anomaly review"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                  {!topCases.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                        No consumer-level bypass cases are present in the latest result set.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#101a17] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-white">Runtime Snapshot</h2>
            <div className="mt-4 space-y-3 text-sm">
              <RuntimeRow label="Result database" value={payload?.result_db ?? "Unknown"} />
              <RuntimeRow label="Collection" value={payload?.result_collection ?? "Unknown"} />
              <RuntimeRow label="Result count" value={(payload?.result_count ?? 0).toLocaleString()} />
              <RuntimeRow label="Model name" value={modelDetails?.model_name ?? "Unknown"} />
              <RuntimeRow label="Model version" value={modelDetails?.model_version ?? "Latest/heuristic"} />
              <RuntimeRow
                label="Runtime ready"
                value={modelDetails?.runtime_ready ? "Yes" : "Fallback active"}
              />
              <RuntimeRow label="Threshold" value={modelDetails ? formatPercent(modelDetails.threshold) : "Unknown"} />
            </div>
          </div>
        </section>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#101a17] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-bold text-white">Executive Revenue Report</h2>
                <p className="text-xs text-slate-400">
                  Generated from latest backend grouped-analysis results.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-slate-200">
              {isGeneratingReport ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
                  <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-sm font-medium">Generating report from live analysis...</p>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{reportContent}</pre>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 p-4">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!reportContent || isGeneratingReport || isDownloadingPdf}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isDownloadingPdf ? "Preparing..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[170px] truncate text-right font-semibold text-slate-200">
        {value}
      </span>
    </div>
  );
}
