"use client";

import { useMemo, useState } from "react";
import { requestCall } from "@/services/fieldOps";
import { useLatestLiveResults } from "@/services/powergridHooks";
import {
  buildTheftCases,
  formatKwh,
  formatNaira,
  formatPercent,
  type TheftCase,
} from "@/lib/powergridAnalytics";

const HAS_VAPI_CLIENT_CONFIG = Boolean(
  process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY &&
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
);

const filters = ["All", "Critical", "High", "Medium"] as const;

export default function FieldOpsPage() {
  const latest = useLatestLiveResults();
  const cases = useMemo(() => buildTheftCases(latest.data, 80), [latest.data]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState("Ready");
  const [isCalling, setIsCalling] = useState(false);

  const filteredCases =
    filter === "All"
      ? cases
      : cases.filter((item) => item.severity === filter);
  const activeCase =
    filteredCases.find((item) => item.id === activeCaseId) ||
    filteredCases[0] ||
    cases[0];

  const totals = useMemo(() => {
    return {
      critical: cases.filter((item) => item.severity === "Critical").length,
      high: cases.filter((item) => item.severity === "High").length,
      scheduled: cases.filter((item) => item.status === "Scheduled").length,
      revenueAtRisk: cases.reduce((sum, item) => sum + item.recoveryAmount, 0),
    };
  }, [cases]);

  const handleStartCall = async () => {
    if (!activeCase) return;
    if (!HAS_VAPI_CLIENT_CONFIG) {
      setCallStatus("Configure Vapi keys to call");
      return;
    }

    setIsCalling(true);
    setCallStatus(`Dialing ${activeCase.contactName}...`);
    const response = await requestCall(
      "start",
      activeCase.id,
      activeCase.contactPhone
    );
    setIsCalling(false);
    setCallStatus(
      response.success
        ? response.data?.status ?? "Dialing"
        : response.message ?? "Call failed"
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1110] p-6 lg:p-8">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Field Operations
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white">
                Inspection Queue
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-muted">
                Ranked service points and households most likely to involve
                meter bypass, direct connection, or abnormal non-technical loss.
              </p>
            </div>
            <button
              onClick={() => latest.refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-dark px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:border-primary/50 hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Metric title="Critical" value={String(totals.critical)} tone="red" />
            <Metric title="High Risk" value={String(totals.high)} tone="amber" />
            <Metric
              title="Scheduled"
              value={String(totals.scheduled)}
              tone="green"
            />
            <Metric
              title="Revenue At Risk"
              value={formatNaira(totals.revenueAtRisk)}
              tone="green"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  filter === item
                    ? "border-primary bg-primary text-black"
                    : "border-border-dark text-text-muted hover:border-primary/50 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-border-dark bg-[#111813]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border-dark text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-4 py-3">Case</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Network Asset</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Loss</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {filteredCases.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setActiveCaseId(item.id)}
                      className={`cursor-pointer transition-colors hover:bg-white/5 ${
                        activeCase?.id === item.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-white">{item.id}</p>
                        <p className="text-xs text-text-muted">
                          {item.customerId}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[260px] truncate font-medium text-white">
                          {item.address}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.zone} | {item.region}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-text-muted">
                        <p>{item.feederId}</p>
                        <p className="text-xs">{item.transformerId}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={severityClass(item.severity)}>
                          {item.severity}
                        </span>
                        <p className="mt-1 text-xs text-text-muted">
                          {formatPercent(item.riskScore)} confidence{" "}
                          {formatPercent(item.confidenceScore)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">
                          {formatKwh(item.lossKwh)} kWh
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatNaira(item.recoveryAmount)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="rounded-full border border-border-dark bg-black/20 px-2 py-1 text-xs font-bold text-text-muted">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!filteredCases.length && (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-text-muted" colSpan={6}>
                        {latest.isLoading
                          ? "Loading latest bypass-risk queue."
                          : "No inspection cases match this filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-border-dark bg-[#111813] p-5">
          {activeCase ? (
            <CaseDetail
              item={activeCase}
              callStatus={callStatus}
              isCalling={isCalling}
              onStartCall={handleStartCall}
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center text-center text-sm text-text-muted">
              Load live analysis to populate the inspection queue.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-300"
      : tone === "amber"
        ? "text-amber-300"
        : "text-primary";

  return (
    <div className="rounded-lg border border-border-dark bg-[#111813] p-4">
      <p className="text-xs font-bold uppercase text-text-muted">{title}</p>
      <p className={`mt-2 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function CaseDetail({
  item,
  callStatus,
  isCalling,
  onStartCall,
}: {
  item: TheftCase;
  callStatus: string;
  isCalling: boolean;
  onStartCall: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Selected Case
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">{item.id}</h2>
        <p className="mt-1 text-sm text-text-muted">{item.reason}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Detail label="Risk Score" value={formatPercent(item.riskScore)} />
        <Detail label="Severity" value={item.severity} />
        <Detail label="Loss Estimate" value={`${formatKwh(item.lossKwh)} kWh`} />
        <Detail label="Recovery" value={formatNaira(item.recoveryAmount)} />
      </div>

      <div className="rounded-lg border border-border-dark bg-black/20 p-4">
        <p className="text-sm font-bold text-white">Customer Context</p>
        <dl className="mt-3 space-y-3 text-sm">
          <Row label="Customer" value={item.contactName} />
          <Row label="Phone" value={item.contactPhone} />
          <Row label="Service Point" value={item.servicePointId} />
          <Row label="Meter" value={item.meterType} />
          <Row label="Connection" value={item.connectionType} />
          <Row label="Category" value={item.customerCategory} />
        </dl>
      </div>

      <div className="rounded-lg border border-border-dark bg-black/20 p-4">
        <p className="text-sm font-bold text-white">Network Context</p>
        <dl className="mt-3 space-y-3 text-sm">
          <Row label="Address" value={item.address} />
          <Row label="Region" value={item.region} />
          <Row label="Zone" value={item.zone} />
          <Row label="Feeder" value={item.feederId} />
          <Row label="Transformer" value={item.transformerId} />
        </dl>
      </div>

      <div className="mt-auto rounded-lg border border-border-dark bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">AI Outreach</p>
            <p className="mt-1 text-xs text-text-muted">{callStatus}</p>
          </div>
          <button
            onClick={onStartCall}
            disabled={isCalling}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">call</span>
            {isCalling ? "Calling" : "Call"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-dark bg-black/20 p-3">
      <p className="text-[11px] font-bold uppercase text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="max-w-[220px] text-right font-medium text-white">{value}</dd>
    </div>
  );
}

function severityClass(severity: TheftCase["severity"]) {
  if (severity === "Critical") {
    return "rounded-full border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs font-bold text-red-300";
  }
  if (severity === "High") {
    return "rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300";
  }
  if (severity === "Medium") {
    return "rounded-full border border-blue-400/40 bg-blue-400/10 px-2 py-1 text-xs font-bold text-blue-300";
  }
  return "rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-bold text-primary";
}
