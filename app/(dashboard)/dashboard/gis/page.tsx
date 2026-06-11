"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLatestLiveResults } from "@/services/powergridHooks";
import {
  buildTheftCases,
  formatKwh,
  formatNaira,
  formatPercent,
  severityFromRisk,
  type TheftCase,
} from "@/lib/powergridAnalytics";

declare global {
  interface Window {
    google: any;
    initEdnMap?: () => void;
  }
}

const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

export default function GisPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const latest = useLatestLiveResults();
  const allCases = useMemo(() => buildTheftCases(latest.data, 80), [latest.data]);
  const mappedCases = useMemo(
    () => allCases.map(withFallbackCoordinates).slice(0, 40),
    [allCases]
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);

  const selectedCase =
    mappedCases.find((item) => item.id === selectedCaseId) || mappedCases[0];

  useEffect(() => {
    if (!apiKey) {
      setMapError("Google Maps key is not configured.");
      return;
    }
    if (typeof window === "undefined") return;

    window.initEdnMap = () => {
      if (!mapRef.current || !window.google) return;
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: LAGOS_CENTER,
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0f1b14" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#9db9a6" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f1b14" }] },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#1d2b1f" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0b1110" }],
          },
        ],
      });
    };

    if (window.google) {
      window.initEdnMap();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("#google-maps-sdk");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initEdnMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setMapError("Google Maps failed to load.");
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!window.google || !mapInstance.current) return;
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    mappedCases.forEach((item) => {
      if (!item.coords) return;
      const marker = new window.google.maps.Marker({
        position: item.coords,
        map: mapInstance.current,
        title: `${item.id} ${item.severity}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: item.severity === "Critical" ? 11 : 9,
          fillColor: markerColor(item.severity),
          fillOpacity: 0.92,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        setSelectedCaseId(item.id);
        mapInstance.current.panTo(item.coords);
        mapInstance.current.setZoom(14);
      });
      markers.current.push(marker);
      bounds.extend(item.coords);
    });

    if (!bounds.isEmpty()) {
      mapInstance.current.fitBounds(bounds, 64);
    }
  }, [mappedCases]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1110] p-6 lg:p-8">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                GIS Intelligence
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white">
                Theft Hotspot Map
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-muted">
                High-risk service points, feeders, and transformer zones from
                the latest grouped-analysis result.
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

          <div className="relative min-h-[640px] overflow-hidden rounded-lg border border-border-dark bg-[#111813]">
            {apiKey && !mapError ? (
              <div ref={mapRef} className="absolute inset-0" />
            ) : (
              <div className="grid h-[640px] place-items-center px-6 text-center">
                <div>
                  <span className="material-symbols-outlined text-4xl text-primary">
                    map
                  </span>
                  <p className="mt-3 text-lg font-bold text-white">
                    GIS map unavailable
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {mapError ?? "Map provider is not configured."}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute left-4 top-4 rounded-lg border border-border-dark bg-[#0b1110]/90 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase text-text-muted">
                Visible Cases
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                {mappedCases.length}
              </p>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          {selectedCase && <HotspotDetail item={selectedCase} />}

          <div className="rounded-lg border border-border-dark bg-[#111813]">
            <div className="border-b border-border-dark p-4">
              <p className="text-sm font-bold text-white">Highest Risk Areas</p>
              <p className="mt-1 text-xs text-text-muted">
                Sorted by bypass probability and estimated loss.
              </p>
            </div>
            <div className="max-h-[540px] overflow-y-auto">
              {mappedCases.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCaseId(item.id);
                    if (item.coords && mapInstance.current) {
                      mapInstance.current.panTo(item.coords);
                      mapInstance.current.setZoom(14);
                    }
                  }}
                  className={`w-full border-b border-border-dark px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    selectedCase?.id === item.id ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {item.address}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.feederId} | {item.transformerId}
                      </p>
                    </div>
                    <span className={badgeClass(item.severity)}>
                      {formatPercent(item.riskScore)}
                    </span>
                  </div>
                </button>
              ))}
              {!mappedCases.length && (
                <div className="px-4 py-10 text-center text-sm text-text-muted">
                  {latest.isLoading
                    ? "Loading GIS hotspots."
                    : "No mapped bypass-risk cases available."}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function HotspotDetail({ item }: { item: TheftCase }) {
  return (
    <div className="rounded-lg border border-border-dark bg-[#111813] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Selected Hotspot
          </p>
          <h2 className="mt-2 text-lg font-bold text-white">{item.id}</h2>
        </div>
        <span className={badgeClass(item.severity)}>{item.severity}</span>
      </div>
      <p className="mt-4 text-sm font-medium text-white">{item.address}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Risk" value={formatPercent(item.riskScore)} />
        <Metric label="Loss" value={`${formatKwh(item.lossKwh)} kWh`} />
        <Metric label="Recovery" value={formatNaira(item.recoveryAmount)} />
        <Metric label="Region" value={item.region} />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-dark bg-black/20 p-3">
      <p className="text-[11px] font-bold uppercase text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function withFallbackCoordinates(item: TheftCase, index: number): TheftCase {
  if (item.coords) return item;
  const row = index % 8;
  const column = Math.floor(index / 8) % 5;
  return {
    ...item,
    coords: {
      lat: LAGOS_CENTER.lat + (row - 3.5) * 0.018,
      lng: LAGOS_CENTER.lng + (column - 2) * 0.026,
    },
  };
}

function markerColor(severity: TheftCase["severity"]) {
  if (severity === "Critical") return "#ef4444";
  if (severity === "High") return "#f59e0b";
  if (severity === "Medium") return "#38bdf8";
  return "#11d452";
}

function badgeClass(severity: TheftCase["severity"] | string) {
  const normalized =
    severity === "Critical" || severity === "High" || severity === "Medium"
      ? severity
      : severityFromRisk(0.2);

  if (normalized === "Critical") {
    return "rounded-full border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs font-bold text-red-300";
  }
  if (normalized === "High") {
    return "rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300";
  }
  if (normalized === "Medium") {
    return "rounded-full border border-blue-400/40 bg-blue-400/10 px-2 py-1 text-xs font-bold text-blue-300";
  }
  return "rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-bold text-primary";
}
