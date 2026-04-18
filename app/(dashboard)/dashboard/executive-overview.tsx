"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchInsights } from "@/services/insights";
import { downloadReportPdf, generateReport } from "@/services/reports";
import type { Insight } from "@/types/ai";

const generate30DayTrend = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const trendFactor = 1 + (30 - i) / 100;
    const baseSupplied = (40 + Math.random() * 15) * trendFactor;

    let efficiency = 0.7 + Math.random() * 0.15;
    if (i >= 14 && i <= 16) efficiency = 0.55;
    if (i >= 2 && i <= 4) efficiency = 0.6;

    const billed = baseSupplied * efficiency;

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      supplied: parseFloat(baseSupplied.toFixed(1)),
      billed: parseFloat(billed.toFixed(1)),
    });
  }
  return data;
};

const REAL_TREND_DATA = generate30DayTrend();

const FALLBACK_INSIGHTS: Insight[] = [
  {
    type: "Alert",
    text: "15% drop in billing efficiency detected in North District over last 48h.",
    action: "View",
  },
  {
    type: "Anomaly",
    text: "Transformer T-409 load mismatch suggests meter bypass.",
    action: "Investigate",
  },
  {
    type: "Trend",
    text: "Recovery trend in South Zone exceeds forecast by 8%.",
    action: null,
  },
];

const KPICard = ({
  title,
  value,
  unit,
  trend,
  icon,
  isDanger,
}: {
  title: string;
  value: string;
  unit?: string;
  trend: string;
  icon: string;
  isDanger?: boolean;
}) => (
  <div
    className={`bg-white dark:bg-surface-dark rounded-xl p-4 border ${
      isDanger
        ? "border-danger/30 relative overflow-hidden"
        : "border-border-dark"
    } shadow-sm`}
  >
    {isDanger && <div className="absolute inset-y-0 left-0 w-1 bg-danger" />}
    <div
      className={`flex justify-between items-start mb-2 ${
        isDanger ? "pl-2" : ""
      }`}
    >
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
        {title}
      </p>
      <span
        className={`material-symbols-outlined text-[20px] ${
          isDanger ? "text-danger" : "text-primary"
        }`}
      >
        {icon}
      </span>
    </div>
    <div className={`flex items-baseline gap-2 ${isDanger ? "pl-2" : ""}`}>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}{" "}
        {unit && (
          <span className="text-sm font-normal text-gray-500">{unit}</span>
        )}
      </h3>
    </div>
    <div
      className={`flex items-center gap-1 mt-2 text-xs font-medium w-fit px-1.5 py-0.5 rounded ${
        isDanger
          ? "pl-2 text-danger bg-danger/10"
          : "text-primary bg-primary/10"
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">trending_up</span>
      <span>{trend}</span>
    </div>
  </div>
);

const InsightItem = ({ text, action, type }: Insight) => (
  <div className="flex flex-col gap-2">
    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
      <span
        className={`${
          type === "Alert"
            ? "text-danger"
            : type === "Anomaly"
            ? "text-warning"
            : "text-primary"
        } font-bold`}
      >
        {type}:
      </span>{" "}
      {text}
    </p>
    {action && (
      <button className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors w-fit group">
        {action}{" "}
        <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </button>
    )}
  </div>
);

const RegionBar = ({
  region,
  percentage,
  color,
}: {
  region: string;
  percentage: number;
  color: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{region}</span>
      <span className={`${color.replace("bg-", "text-")} font-bold`}>
        {percentage}%
      </span>
    </div>
    <div className="w-full bg-gray-100 dark:bg-black/30 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const PipelineStage = ({
  stage,
  count,
  colorClass,
  width = "100%",
}: {
  stage: string;
  count: number;
  colorClass: string;
  width?: string;
}) => (
  <div
    className={`bg-gray-100 dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded p-2 flex justify-between items-center relative overflow-hidden`}
    style={{ width }}
  >
    <div className={`absolute inset-y-0 left-0 w-full z-0 ${colorClass}`} />
    <span className="relative z-10 text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">
      {stage}
    </span>
    <span className="relative z-10 text-xs font-bold text-gray-900 dark:text-white mr-2">
      {count}
    </span>
  </div>
);

export default function ExecutiveOverview() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const totals = React.useMemo(() => {
    const supplied = REAL_TREND_DATA.reduce(
      (sum, item) => sum + item.supplied,
      0
    );
    const billed = REAL_TREND_DATA.reduce((sum, item) => sum + item.billed, 0);
    const loss = supplied - billed;
    return { supplied, billed, loss };
  }, []);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetchInsights({
        metrics: {
          energySuppliedMWh: Number(totals.supplied.toFixed(1)),
          energyBilledMWh: Number(totals.billed.toFixed(1)),
          revenueLossUSD: Number((totals.loss * 120).toFixed(0)), // rough $/MWh placeholder
          theftCases: 142,
          recoveryUSD: 1.8 * 1_000_000,
          period: "Last 30 Days",
        },
      });
      if (res.success && res.data) {
        setInsights(res.data);
      } else {
        setInsights(FALLBACK_INSIGHTS);
      }
    } catch (error) {
      console.error("Failed to fetch insights", error);
      setInsights(FALLBACK_INSIGHTS);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleGenerateFullReport = async () => {
    setShowReportModal(true);
    setReportContent("");
    setIsGeneratingReport(true);

    try {
      const res = await generateReport({
        period: "Last 30 Days",
        metrics: {
          supplied: Number(totals.supplied.toFixed(1)),
          billed: Number(totals.billed.toFixed(1)),
          loss: Number(totals.loss.toFixed(1)),
          theftCases: 142,
          recovery: 1.8,
        },
      });

      if (res.success && res.data) {
        setReportContent(res.data.markdown);
      } else {
        setReportContent("## Unable to generate report\nPlease try again.");
      }
    } catch (error) {
      setReportContent(
        "## Error Generating Report\nUnable to connect to AI service. Please try again later."
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportContent) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadReportPdf(reportContent, "Executive Report");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "executive-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:px-8 pb-20 scroll-smooth bg-background-light dark:bg-background-dark relative">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Energy Supplied"
            value="1,245"
            unit="GWh"
            trend="+4.2%"
            icon="bolt"
          />
          <KPICard
            title="Total Energy Billed"
            value="890"
            unit="GWh"
            trend="+1.8%"
            icon="receipt_long"
          />
          <KPICard
            title="Non-Tech Loss"
            value="28.5%"
            trend="2.4% vs last mo"
            icon="warning"
            isDanger
          />
          <KPICard
            title="Est. Revenue Loss"
            value="$4.2M"
            trend="High Risk"
            icon="money_off"
            isDanger
          />
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-dark shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Theft Cases Detected
              </p>
              <span className="material-symbols-outlined text-warning text-[20px]">
                policy
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                142
              </h3>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-text-muted">
              <span className="text-primary font-bold">+12</span> this week
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-border-dark shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Recovery Progress
              </p>
              <span className="material-symbols-outlined text-primary text-[20px]">
                savings
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                $1.8M
              </h3>
            </div>
            <div className="w-full bg-gray-200 dark:bg-black/40 rounded-full h-1.5 mt-3">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: "65%" }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1 text-right">
              65% of Target
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-border-dark p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Energy Supplied vs. Billed
                </h2>
                <p className="text-sm text-text-muted">
                  30-day Trend Analysis (GWh)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Supplied
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Billed
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={REAL_TREND_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorSupplied"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#11d452" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#11d452" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorBilled"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#28392e"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9db9a6", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1c271f",
                      border: "1px solid #28392e",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#9db9a6", marginBottom: "5px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="supplied"
                    stroke="#11d452"
                    fillOpacity={1}
                    fill="url(#colorSupplied)"
                    strokeWidth={2}
                    name="Supplied (GWh)"
                  />
                  <Area
                    type="monotone"
                    dataKey="billed"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorBilled)"
                    strokeWidth={2}
                    name="Billed (GWh)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-surface-dark/5 dark:bg-gradient-to-br dark:from-surface-dark dark:to-background-dark rounded-xl border border-primary/30 p-1 flex flex-col relative shadow-[0_0_15px_-5px_rgba(17,212,82,0.1)]">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 rounded-t-lg border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-primary ${
                    isLoadingInsights ? "animate-spin" : ""
                  }`}
                >
                  {isLoadingInsights ? "sync" : "auto_awesome"}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  AI Insights
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />{" "}
                Live
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
              {isLoadingInsights ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                insights.map((insight, idx) => (
                  <React.Fragment key={idx}>
                    <InsightItem
                      text={insight.text}
                      action={insight.action}
                      type={insight.type}
                    />
                    {idx < insights.length - 1 && (
                      <hr className="border-border-dark/50" />
                    )}
                  </React.Fragment>
                ))
              )}
            </div>

            <div className="p-4 mt-auto border-t border-border-dark bg-gray-50 dark:bg-black/20 rounded-b-lg">
              <button
                onClick={handleGenerateFullReport}
                className="w-full py-2 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark text-xs font-medium text-gray-600 dark:text-text-muted hover:text-primary dark:hover:text-white hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  summarize
                </span>
                Generate Full AI Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-dark p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Revenue Loss by Region
              </h3>
              <button className="text-gray-400 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">
                  more_horiz
                </span>
              </button>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <RegionBar
                region="North District"
                percentage={32}
                color="bg-danger"
              />
              <RegionBar
                region="East Zone"
                percentage={18}
                color="bg-warning"
              />
              <RegionBar
                region="South District"
                percentage={12}
                color="bg-primary"
              />
              <RegionBar
                region="Central Grid"
                percentage={8}
                color="bg-primary"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-dark p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Theft Cases Pipeline
              </h3>
              <button className="text-gray-400 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">
                  filter_list
                </span>
              </button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PipelineStage
                stage="Detected"
                count={142}
                colorClass="bg-blue-500/10"
              />
              <div className="h-3 w-0.5 bg-border-dark" />
              <PipelineStage
                stage="Investigating"
                count={89}
                colorClass="bg-yellow-500/10"
                width="85%"
              />
              <div className="h-3 w-0.5 bg-border-dark" />
              <PipelineStage
                stage="Confirmed"
                count={54}
                colorClass="bg-orange-500/10"
                width="70%"
              />
              <div className="h-3 w-0.5 bg-border-dark" />
              <div className="w-[55%] bg-primary shadow shadow-primary/20 rounded p-2 flex justify-between items-center text-white">
                <span className="text-xs font-bold ml-2">Recovered</span>
                <span className="text-xs font-bold mr-2">31</span>
              </div>
            </div>
          </div>
        </div>

        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-background-light dark:bg-[#111813] w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl border border-border-dark flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border-dark bg-surface-dark/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <span className="material-symbols-outlined text-primary">
                      assignment_turned_in
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Executive Revenue Report
                    </h2>
                    <p className="text-xs text-text-muted">
                      Generated by EDN AI (mock) ·{" "}
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 font-sans text-gray-800 dark:text-gray-300 leading-relaxed">
                {isGeneratingReport ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                      auto_awesome
                    </span>
                    <p className="text-sm font-medium animate-pulse">
                      Analyzing grid data & generating report...
                    </p>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="markdown-content whitespace-pre-line">
                      {reportContent}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border-dark bg-surface-dark/30 flex justify-end gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={
                    !reportContent || isGeneratingReport || isDownloadingPdf
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                    !reportContent || isGeneratingReport || isDownloadingPdf
                      ? "bg-gray-500/40 text-gray-300 cursor-not-allowed"
                      : "bg-primary text-black hover:bg-green-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isDownloadingPdf ? "sync" : "download"}
                  </span>
                  {isDownloadingPdf ? "Preparing..." : "Export PDF"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
