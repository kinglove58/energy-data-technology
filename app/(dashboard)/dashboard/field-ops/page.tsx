"use client";

import { useState, useEffect } from "react";
import { requestCall, getCallStatus } from "@/services/fieldOps";

const HAS_VAPI_CLIENT_CONFIG = Boolean(
  process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY &&
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
);

// Mock Data for Theft Cases
const CASES_DATA = [
  {
    id: "TC-9921",
    address: "Block 4, Industrial Estate",
    type: "Meter Bypass",
    severity: "Critical",
    status: "Active",
    detected: "2h ago",
    loss: "$2,400/mo",
    assignee: "Unassigned",
    tags: ["Meter Bypass", "Comm: Ind."],
    sla: "02:15:00",
    priority: "Active",
    contactName: "Mr. Ali Mensah",
    contactPhone: "+2348160799990",
    meterId: "MB-9921-X",
    context:
      "Flagged anomaly on meter #MB-9921. AMI data shows zero consumption during peak load. Confirm if premises are occupied.",
  },
  {
    id: "TC-9924",
    address: "12 Maple Ave, Residential",
    type: "Magnetic Tamper",
    severity: "High",
    status: "Investigating",
    detected: "5h ago",
    loss: "$450/mo",
    assignee: "J. Doe",
    tags: ["Tampering"],
    sla: "04:00:00",
    priority: "Pending",
    contactName: "Mrs. Sarah Osei",
    contactPhone: "+2348160799991",
    meterId: "MT-9924-R",
    context:
      "Magnetic field interference log detected. Ask about recent electrical work near the meter box.",
  },
  {
    id: "TC-9855",
    address: "Sector 7, Market Square",
    type: "Direct Hook",
    severity: "Critical",
    status: "Scheduled",
    detected: "1d ago",
    loss: "$1,200/mo",
    assignee: "Team Alpha",
    tags: ["Direct Hook"],
    sla: "Tomorrow",
    priority: "Scheduled",
    contactName: "Kojo & Sons Ltd",
    contactPhone: "+2348160799992",
    meterId: "DH-9855-A",
    context:
      "Line loss analysis indicates direct hooking on Phase B. Schedule immediate inspection.",
  },
  {
    id: "TC-9802",
    address: "88 Oak St",
    type: "Usage Anomaly",
    severity: "Medium",
    status: "Pending",
    detected: "2d ago",
    loss: "$150/mo",
    assignee: "Unassigned",
    tags: ["Check"],
    sla: "2d",
    priority: "Pending",
    contactName: "Mr. Kwame Boateng",
    contactPhone: "+2348160799993",
    meterId: "UA-9802-C",
    context:
      "Sudden drop in average consumption. Verify if solar installation or vacancy is the cause.",
  },
  {
    id: "TC-9750",
    address: "Plot 44, New Extension",
    type: "Meter Bypass",
    severity: "High",
    status: "Resolved",
    detected: "4d ago",
    loss: "$890/mo",
    assignee: "K. Smith",
    tags: ["Resolved"],
    sla: "-",
    priority: "Resolved",
    contactName: "Ms. Abena Darko",
    contactPhone: "+2348160799994",
    meterId: "MB-9750-Z",
    context:
      "Case Resolved. Follow up call to confirm new meter installation satisfaction.",
  },
  {
    id: "TC-9711",
    address: "Commercial Complex A",
    type: "Load Mismatch",
    severity: "Low",
    status: "Resolved",
    detected: "1w ago",
    loss: "$120/mo",
    assignee: "Auto-Resolved",
    tags: ["Mismatch"],
    sla: "-",
    priority: "Resolved",
    contactName: "Complex Admin",
    contactPhone: "+2348160799995",
    meterId: "LM-9711-P",
    context: "Minor load mismatch resolved remotely. No action required.",
  },
];

const FieldOpsPageComponent: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Ready");
  const [callId, setCallId] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(
    CASES_DATA[0].id
  );
  const [filter, setFilter] = useState("All");
  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const hasVapiConfig = HAS_VAPI_CLIENT_CONFIG;
  // Details Panel State
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(CASES_DATA[0]);

  // Manual Report Modal State
  const [showManualReportModal, setShowManualReportModal] = useState(false);

  const filteredCases =
    filter === "All"
      ? CASES_DATA
      : CASES_DATA.filter((c) => c.status === filter);

  // Derived state for the AI Outreach Widget
  // It uses the selectedCase or falls back to the activeCaseId, or the first case in the list.
  const activeCaseData =
    selectedCase ||
    CASES_DATA.find((c) => c.id === activeCaseId) ||
    CASES_DATA[0];

  useEffect(() => {
    if (isAutoCalling && !isCallActive) {
      handleStartCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCaseId, isAutoCalling]);

  useEffect(() => {
    if (!callId || !isCallActive) return;
    const interval = setInterval(async () => {
      const res = await getCallStatus(callId);
      if (res.success) {
        const status = res.data?.status || "unknown";
        setCallStatus(status);
        if (
          [
            "ended",
            "completed",
            "failed",
            "canceled",
            "hangup",
            "disconnected",
          ].includes(status)
        ) {
          setIsCallActive(false);
          setCallId(null);
        }
      } else {
        setCallStatus(res.message || "Status error");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [callId, isCallActive]);

  const handleStartCall = async () => {
    if (!hasVapiConfig) {
      setCallStatus("Configure Vapi keys to call");
      return;
    }

    if (!activeCaseData.contactPhone) {
      setCallStatus("No phone number on case");
      return;
    }

    setCallStatus(`Dialing ${activeCaseData.contactName}...`);
    const res = await requestCall(
      "start",
      activeCaseData.id,
      activeCaseData.contactPhone
    );

    if (res.success) {
      setIsCallActive(true);
      setCallStatus(res.data?.status ?? "Dialing");
      setCallId((res.data as any)?.vapiCallId || null);
    } else {
      setIsCallActive(false);
      setCallStatus(res.message ?? "Call failed");
    }
  };

  const handleEndCall = async () => {
    await requestCall("stop", activeCaseData?.id, activeCaseData?.contactPhone);
    setIsCallActive(false);
    setCallStatus("Ended");
  };

  const handleExportReport = () => {
    const headers = [
      "Case ID",
      "Address",
      "Type",
      "Severity",
      "Status",
      "Detected",
      "Loss",
      "Assignee",
    ];
    const rows = filteredCases.map((c) => [
      c.id,
      `"${c.address}"`,
      c.type,
      c.severity,
      c.status,
      c.detected,
      `"${c.loss}"`,
      c.assignee,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `field_ops_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowManualReportModal(false);
    alert(
      "Manual Field Report submitted successfully. Case #TC-NEW created and assigned to triage."
    );
  };

  const handleCaseSelect = (caseItem: any) => {
    setActiveCaseId(caseItem.id);
    setSelectedCase(caseItem);
    setShowDetailsPanel(true);
  };

  const getCaseVariant = (priority: string) => {
    if (priority === "Active") return "red";
    if (priority === "Pending") return "orange";
    if (priority === "Scheduled") return "blue";
    return "blue";
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide bg-background-light dark:bg-background-dark relative">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Field Operations & Theft Response
              </h1>
              <p className="text-text-muted text-sm mt-1">
                Unified command center for case assignment, outreach, and
                resolution.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportReport}
                className="bg-white/5 border border-white/10 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined">download</span>
                Export Report
              </button>
              <button
                onClick={() => setShowManualReportModal(true)}
                className="bg-primary hover:bg-primary-hover text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                Manual Report
              </button>
            </div>
          </div>

          {/* Combined KPI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Assignments"
              value="12"
              subtext="+2 New Alerts"
              icon="assignment"
              color="primary"
            />
            <StatCard
              title="Response Time"
              value="45m"
              unit="avg"
              subtext="-10% vs last week"
              icon="timer"
              color="blue"
            />
            <StatCard
              title="SLA At Risk"
              value="2"
              subtext="Action Required"
              icon="warning"
              color="orange"
              isWarning
            />
            <StatCard
              title="Recovery YTD"
              value="$42.5k"
              subtext="Target: $50k"
              icon="savings"
              color="emerald"
            />
          </div>
        </div>

        {/* Section 1: Active Workspace (Assignments + Vapi) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                my_location
              </span>
              Active Assignments
            </h3>
            {!hasVapiConfig && (
              <div className="border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm rounded-lg px-3 py-2">
                Configure Vapi keys (NEXT_PUBLIC_VAPI_PUBLIC_KEY and
                NEXT_PUBLIC_VAPI_ASSISTANT_ID) to place calls. You can still
                explore the workspace and cases.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((c) => (
                <CaseCard
                  key={c.id}
                  id={c.id}
                  address={c.address}
                  tags={c.tags || [c.type]}
                  sla={c.sla || "24h"}
                  priority={c.priority || c.status}
                  variant={getCaseVariant(c.priority || c.status)}
                  onSelect={() => handleCaseSelect(c)}
                  isActive={activeCaseId === c.id}
                />
              ))}
              <div className="border border-dashed border-border-dark rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-dark hover:text-primary transition-colors cursor-pointer min-h-[160px]">
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">
                    add_circle
                  </span>
                  <span className="text-sm font-medium">
                    Pull Next Assignment
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vapi Call Widget */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                record_voice_over
              </span>
              AI Outreach
            </h3>
            <div className="bg-surface-highlight border border-border-dark rounded-xl p-5 flex flex-col gap-4 shadow-lg sticky top-6 transition-all max-h-[320px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Animated Avatar Ring */}
                  <div
                    className={`relative size-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCallActive
                        ? "bg-primary/20 text-primary"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {isCallActive && (
                      <span
                        className={`absolute inset-0 rounded-full border-2 border-primary ${
                          isAssistantSpeaking
                            ? "animate-ping opacity-75"
                            : "opacity-0"
                        }`}
                      ></span>
                    )}
                    <span className="material-symbols-outlined text-2xl relative z-10">
                      {isCallActive ? "graphic_eq" : "person"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      {activeCaseData.contactName}
                    </p>
                    <p className="text-text-muted text-xs">
                      {activeCaseData.contactPhone}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded bg-[#1c2e24] text-xs text-text-muted border border-border-dark">
                  Owner
                </div>
              </div>

              {/* Call Context / Visualizer */}
              <div className="bg-[#1c2e24] p-3 rounded-lg border border-border-dark min-h-[80px] flex flex-col justify-center relative overflow-hidden">
                {!isCallActive ? (
                  <>
                    <p className="text-[10px] text-text-muted uppercase mb-1 font-bold">
                      Call Script Context
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed italic">
                      "{activeCaseData.context}"
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-1 h-10">
                    {/* Audio Visualizer Bars */}
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-primary rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(
                            4,
                            volumeLevel * 40 * (Math.random() * 1.5 + 0.5)
                          )}px`,
                          opacity: volumeLevel > 0.01 ? 1 : 0.3,
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connection Status */}
              <div className="flex justify-between items-center text-xs mt-auto pt-4">
                <span className="text-text-muted">Status:</span>
                <div className="flex items-center gap-2">
                  {isCallActive && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                  <span
                    className={`font-bold ${
                      isCallActive ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {callStatus}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-4 gap-2">
                {!isCallActive ? (
                  <button
                    onClick={handleStartCall}
                    disabled={!hasVapiConfig}
                    className={`col-span-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(17,212,82,0.3)] ${
                      hasVapiConfig
                        ? "bg-primary hover:bg-green-400 text-black font-bold"
                        : "bg-gray-500/40 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      call
                    </span>
                    Call {activeCaseData.contactName.split(" ")[0] || "Contact"}
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="col-span-3 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      call_end
                    </span>
                    End Call
                  </button>
                )}

                <button className="col-span-1 bg-[#1c2e24] hover:bg-[#25382e] text-white border border-border-dark rounded-lg flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 border border-border-dark/60 bg-[#1c2e24] rounded-lg px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-text-muted font-bold">
                    Auto-call
                  </span>
                  <span className="text-xs text-white">
                    Call contact when switching cases
                  </span>
                </div>
                <button
                  disabled={!hasVapiConfig}
                  onClick={() => setIsAutoCalling(!isAutoCalling)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    isAutoCalling && hasVapiConfig
                      ? "bg-primary"
                      : "bg-surface-active"
                  } ${!hasVapiConfig ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                      isAutoCalling ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Theft Intelligence Database */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              table_chart
            </span>
            Theft Intelligence Database
          </h3>
          <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-border-dark flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 bg-background-light dark:bg-[#111813] border border-border-dark rounded-lg px-3 py-2 w-full sm:w-96">
                <span className="material-symbols-outlined text-text-muted">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search case ID, address, or type..."
                  className="bg-transparent border-none focus:ring-0 text-sm w-full text-gray-900 dark:text-white placeholder-text-muted"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                {[
                  "All",
                  "Active",
                  "Investigating",
                  "Scheduled",
                  "Resolved",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      filter === status
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-text-muted hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-black/20 text-xs uppercase text-text-muted font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Case Details</th>
                    <th className="px-6 py-4">Detection Type</th>
                    <th className="px-6 py-4">Severity / Loss</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assignee</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark text-sm">
                  {filteredCases.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {item.id}
                          </span>
                          <span className="text-text-muted text-xs">
                            {item.address}
                          </span>
                          <span className="text-text-muted text-[10px] mt-0.5">
                            {item.detected}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <SeverityBadge level={item.severity} />
                          <span className="text-xs text-text-muted">
                            {item.loss}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white">
                            {item.assignee.charAt(0)}
                          </div>
                          <span className="text-gray-300">{item.assignee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCaseSelect(item)}
                          className="text-text-muted hover:text-primary transition-colors p-2 rounded-full hover:bg-white/10"
                          aria-label="More options"
                        >
                          <span className="material-symbols-outlined">
                            more_vert
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Report Modal */}
      {showManualReportModal && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1c271f] w-full max-w-lg rounded-2xl border border-border-dark shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border-dark flex justify-between items-center bg-surface-highlight">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  edit_document
                </span>
                Manual Field Report
              </h3>
              <button
                onClick={() => setShowManualReportModal(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleManualReportSubmit}
              className="p-6 flex flex-col gap-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">
                  Incident Location
                </label>
                <input
                  type="text"
                  placeholder="Enter full address or coordinates"
                  required
                  className="w-full bg-surface-active border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase">
                    Type
                  </label>
                  <select className="w-full bg-surface-active border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none">
                    <option>Meter Bypass</option>
                    <option>Direct Hooking</option>
                    <option>Physical Damage</option>
                    <option>Usage Anomaly</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase">
                    Severity
                  </label>
                  <select className="w-full bg-surface-active border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase">
                  Field Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe observations, connected load estimates, etc."
                  className="w-full bg-surface-active border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3 border-t border-border-dark mt-2">
                <button
                  type="button"
                  onClick={() => setShowManualReportModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border-dark text-text-muted font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-primary text-black font-bold text-sm hover:bg-green-400 transition-colors shadow-[0_0_15px_rgba(17,212,82,0.3)]"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details Side Panel */}
      <style>{`
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
      {showDetailsPanel && selectedCase && (
        <div className="fixed inset-0 z-[1500] flex justify-end pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-auto transition-opacity"
            onClick={() => setShowDetailsPanel(false)}
          ></div>

          {/* Panel */}
          <div className="w-full max-w-md bg-[#1c271f] h-full shadow-2xl border-l border-border-dark pointer-events-auto transform transition-transform animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border-dark flex justify-between items-start bg-[#203425]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">
                    Case #{selectedCase.id}
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      selectedCase.severity === "Critical"
                        ? "bg-red-500/20 text-red-500"
                        : selectedCase.severity === "High"
                        ? "bg-orange-500/20 text-orange-500"
                        : "bg-blue-500/20 text-blue-500"
                    }`}
                  >
                    {selectedCase.severity}
                  </span>
                </div>
                <p className="text-sm text-text-muted">
                  {selectedCase.address}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                <div>
                  <p className="text-[10px] text-text-muted uppercase">
                    Current Status
                  </p>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedCase.status === "Active"
                          ? "bg-red-500 animate-pulse"
                          : "bg-primary"
                      }`}
                    ></span>
                    {selectedCase.status}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase">
                    Detected
                  </p>
                  <p className="text-sm font-bold text-white">
                    {selectedCase.detected}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase">
                    Est. Loss
                  </p>
                  <p className="text-sm font-bold text-red-400">
                    {selectedCase.loss}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    person
                  </span>{" "}
                  Customer Profile
                </h3>
                <div className="bg-surface-active/50 rounded-lg p-4 border border-border-dark space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Account Name</span>
                    <span className="text-white font-medium">
                      {selectedCase.contactName || "John Doe (Owner)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Contact</span>
                    <span className="text-white font-medium">
                      {selectedCase.contactPhone || "+1 (555) 012-3456"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Meter ID</span>
                    <span className="text-white font-medium font-mono tracking-wider">
                      {selectedCase.meterId || "MB-4922-X"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Avg Consumption</span>
                    <span className="text-white font-medium">450 kWh/mo</span>
                  </div>
                </div>
              </div>

              {/* Anomaly Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    warning
                  </span>{" "}
                  Anomaly Evidence
                </h3>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-red-200 font-bold text-sm">
                        {selectedCase.type} Suspected
                      </p>
                      <p className="text-red-200/70 text-xs mt-1 leading-relaxed">
                        Advanced Metering Infrastructure (AMI) detected a load
                        signature mismatch. Consumption drops to zero during
                        peak hours (18:00 - 21:00) despite active load on the
                        distribution transformer phase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    history
                  </span>{" "}
                  Timeline
                </h3>
                <div className="space-y-4 pl-2 border-l border-white/10 ml-2">
                  <div className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border border-[#1c271f]"></div>
                    <p className="text-xs text-text-muted">Today, 10:30 AM</p>
                    <p className="text-sm text-white mt-0.5">
                      Assigned to Field Ops Team A
                    </p>
                  </div>
                  <div className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white/20 border border-[#1c271f]"></div>
                    <p className="text-xs text-text-muted">
                      Yesterday, 04:15 PM
                    </p>
                    <p className="text-sm text-white mt-0.5">
                      Automated Alert Triggered (AI-v2.1)
                    </p>
                  </div>
                  <div className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white/20 border border-[#1c271f]"></div>
                    <p className="text-xs text-text-muted">
                      Yesterday, 04:00 PM
                    </p>
                    <p className="text-sm text-white mt-0.5">
                      Anomalous Drop in Voltage Recorded
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-dark bg-[#203425] flex gap-3">
              <button
                onClick={() => alert("Escalated to Supervisor")}
                className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-colors"
              >
                Escalate
              </button>
              <button
                onClick={() => {
                  alert("Case marked as Resolved");
                  setShowDetailsPanel(false);
                }}
                className="flex-1 py-3 rounded-lg bg-primary hover:bg-green-400 text-black font-bold text-sm shadow-lg shadow-primary/20 transition-colors"
              >
                Resolve Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Components ---

const StatCard = ({
  title,
  value,
  unit,
  subtext,
  icon,
  color,
  isWarning,
}: any) => {
  const colors: any = {
    primary: "text-primary bg-primary/10",
    blue: "text-blue-400 bg-blue-400/10",
    orange: "text-orange-400 bg-orange-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
  };
  return (
    <div className="flex flex-col gap-1 rounded-xl p-5 bg-surface-highlight border border-border-dark">
      <div className="flex justify-between items-start">
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <span
          className={`material-symbols-outlined ${colors[color]} p-1 rounded`}
        >
          {icon}
        </span>
      </div>
      <p className="text-white text-3xl font-bold mt-2">
        {value}
        {unit && (
          <span className="text-lg text-text-muted font-normal ml-1">
            {unit}
          </span>
        )}
      </p>
      <p
        className={`${
          isWarning ? "text-orange-400" : "text-text-muted"
        } text-xs font-medium flex items-center gap-1`}
      >
        {isWarning && (
          <span className="material-symbols-outlined text-[14px]">warning</span>
        )}{" "}
        {subtext}
      </p>
    </div>
  );
};

const CaseCard = ({
  id,
  address,
  tags,
  sla,
  priority,
  variant = "red",
  onSelect,
  isActive,
}: any) => {
  const activeClass = isActive
    ? "bg-[#1f3326] border-primary/50 shadow-lg shadow-black/20"
    : "bg-surface-highlight hover:bg-[#2f4236] border-transparent hover:border-border-dark";

  // Simple color mapping
  const colors: any = {
    red: { bg: "bg-red-500/10", text: "text-red-500", icon: "priority_high" },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-500",
      icon: "warning",
    },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", icon: "schedule" },
  };
  // Fallback if variant isn't one of the keys
  const c = colors[variant] || colors["blue"];

  return (
    <div
      onClick={onSelect}
      className={`${activeClass} border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all cursor-pointer min-h-[160px]`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex flex-col items-center justify-center size-10 rounded-lg ${c.bg} ${c.text} border border-${variant}-500/20 flex-shrink-0`}
        >
          <span className="material-symbols-outlined">{c.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-bold text-sm">Case #{id}</h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isActive ? "bg-primary text-black" : "bg-[#3b5443] text-white"
              } uppercase tracking-wider`}
            >
              {priority}
            </span>
          </div>
          <p className="text-gray-300 text-xs">{address}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-auto">
        {tags.map((t: string) => (
          <span
            key={t}
            className="text-[10px] text-text-muted bg-[#1c2e24] px-2 py-1 rounded"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center border-t border-border-dark pt-3 mt-1">
        <div className="">
          <p className="text-[10px] text-text-muted">
            {priority === "Active" ? "SLA Due In" : "Status"}
          </p>
          <p
            className={`${
              priority === "Active" ? "text-red-400" : "text-white"
            } font-mono font-bold text-xs`}
          >
            {sla}
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-lg opacity-0 hover:opacity-100 transition-opacity">
          arrow_forward
        </span>
      </div>
    </div>
  );
};

const SeverityBadge = ({ level }: { level: string }) => {
  let styles = "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  if (level === "Critical")
    styles = "bg-red-500/10 text-red-500 border border-red-500/20";
  if (level === "High")
    styles = "bg-orange-500/10 text-orange-500 border border-orange-500/20";
  if (level === "Medium")
    styles = "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide w-fit ${styles}`}
    >
      {level}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let icon = "help";
  let colorClass = "text-gray-500";

  if (status === "Active") {
    icon = "warning";
    colorClass = "text-red-500";
  }
  if (status === "Investigating") {
    icon = "search";
    colorClass = "text-orange-500";
  }
  if (status === "Scheduled") {
    icon = "schedule";
    colorClass = "text-blue-500";
  }
  if (status === "Resolved") {
    icon = "check_circle";
    colorClass = "text-primary";
  }

  return (
    <div className={`flex items-center gap-1.5 ${colorClass}`}>
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span className="text-xs font-medium">{status}</span>
    </div>
  );
};

export default FieldOpsPageComponent;
