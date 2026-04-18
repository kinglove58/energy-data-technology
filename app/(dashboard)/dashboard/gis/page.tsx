'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

type LatLng = { lat: number; lng: number };

type Incident = {
  id: string;
  title: string;
  coords: LatLng;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  loss: string;
  status: string;
  address: string;
};

const INCIDENTS: Incident[] = [
  {
    id: 'TC-9921',
    title: 'TX-992 - Critical Loss',
    coords: { lat: 6.5244, lng: 3.3792 }, // Lagos
    severity: 'Critical',
    loss: '$2,400/mo',
    status: 'Active',
    address: 'Block 4, Industrial Estate, Lagos',
  },
  {
    id: 'TC-9924',
    title: 'MT-9924 - Magnetic Tamper',
    coords: { lat: 6.4654, lng: 3.4064 }, // Ikeja-ish
    severity: 'High',
    loss: '$450/mo',
    status: 'Investigating',
    address: '12 Maple Ave, Ikeja',
  },
  {
    id: 'TC-9855',
    title: 'DH-9855 - Direct Hook',
    coords: { lat: 6.6018, lng: 3.3515 }, // Shomolu
    severity: 'Critical',
    loss: '$1,200/mo',
    status: 'Scheduled',
    address: 'Sector 7, Market Square',
  },
  {
    id: 'TC-9802',
    title: 'UA-9802 - Usage Anomaly',
    coords: { lat: 6.4531, lng: 3.3958 }, // Surulere
    severity: 'Medium',
    loss: '$150/mo',
    status: 'Pending',
    address: '88 Oak St, Surulere',
  },
  {
    id: 'TC-9750',
    title: 'MB-9750 - Meter Bypass',
    coords: { lat: 6.4418, lng: 3.3881 }, // Apapa
    severity: 'High',
    loss: '$890/mo',
    status: 'Resolved',
    address: 'Plot 44, New Extension',
  },
];

export default function GisPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement | null>(null);
const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const incidentMarkers = useRef<Record<string, any>>({});
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LatLng | null>(null);
  const [inputs, setInputs] = useState<LatLng>({ lat: 6.5244, lng: 3.3792 }); // Lagos default

  const [position, setPosition] = useState({ x: 0, y: 80 });

  const [isDragging, setIsDragging] = useState(false);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!apiKey) {
      setMapError('Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to load Google Maps.');
      return;
    }
    if (typeof window === 'undefined') return;
    if (window.google && mapRef.current && !mapInstance.current) {
      initMap();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('#google-maps-sdk');
    if (existing) {
      existing.addEventListener('load', initMap);
      return () => existing.removeEventListener('load', initMap);
    }

    setIsLoadingMap(true);
    window.initMap = initMap;
    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setMapError('Failed to load Google Maps. Check API key and network.');
      setIsLoadingMap(false);
    };
    document.head.appendChild(script);
    return () => {
      script.removeEventListener('load', initMap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const updatePosition = () => {
      setPosition({ x: window.innerWidth - 384 - 24, y: 80 });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;
    const g = window.google;
    mapInstance.current = new g.maps.Map(mapRef.current, {
      center: inputs,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0f1b14' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#9db9a6' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1b14' }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#203425' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#17231a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1d2b1f' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1110' }] },
      ],
    });

    mapInstance.current.addListener('click', (e: any) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      placeMarker(pos);
    });

    plotIncidents(g);
    placeMarker(inputs);
    setIsLoadingMap(false);
  };

  const plotIncidents = (g: any) => {
    const bounds = new g.maps.LatLngBounds();
    INCIDENTS.forEach((incident) => {
      const marker = new g.maps.Marker({
        position: incident.coords,
        map: mapInstance.current,
        title: incident.title,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: incident.severity === 'Critical' ? '#ef4444' : incident.severity === 'High' ? '#f59e0b' : '#11d452',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => {
        mapInstance.current.panTo(incident.coords);
        mapInstance.current.setZoom(14);
        setSelected(incident.coords);
      });
      incidentMarkers.current[incident.id] = marker;
      bounds.extend(incident.coords);
    });
    if (!bounds.isEmpty()) {
      mapInstance.current.fitBounds(bounds, 60);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const placeMarker = (pos: LatLng) => {
    if (!window.google || !mapInstance.current) return;
    const g = window.google;
    if (!markerRef.current) {
      markerRef.current = new g.maps.Marker({
        position: pos,
        map: mapInstance.current,
        draggable: true,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#11d452',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      markerRef.current.addListener('dragend', (e: any) => {
        const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setSelected(p);
        setInputs(p);
      });
    } else {
      markerRef.current.setPosition(pos);
    }
    mapInstance.current.panTo(pos);
    setSelected(pos);
    setInputs(pos);
  };

  const handleCenter = () => {
    if (!mapInstance.current) return;
    const pos = { lat: inputs.lat, lng: inputs.lng };
    mapInstance.current.panTo(pos);
    placeMarker(pos);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        placeMarker(coords);
      },
      () => setMapError('Unable to fetch current location.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 relative bg-background-dark">
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background-dark/90 to-transparent z-[1000] flex items-center px-6 gap-4 pointer-events-none">
        <div className="pointer-events-auto flex-1 max-w-xl">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={inputs.lat}
              onChange={(e) => setInputs((p) => ({ ...p, lat: Number(e.target.value) }))}
              className="col-span-1 bg-surface-dark/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Lat"
            />
            <input
              type="number"
              value={inputs.lng}
              onChange={(e) => setInputs((p) => ({ ...p, lng: Number(e.target.value) }))}
              className="col-span-1 bg-surface-dark/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Lng"
            />
            <button
              onClick={handleCenter}
              className="col-span-1 bg-primary text-black font-bold rounded-lg px-3 py-2 text-sm hover:bg-primary-hover transition-colors"
            >
              Go
            </button>
          </div>
        </div>
        <div className="pointer-events-auto flex gap-3 ml-auto">
          <button
            onClick={handleGeolocate}
            className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white bg-surface-dark/80 hover:bg-surface-dark transition-colors"
          >
            Use My Location
          </button>
        </div>
      </div>

      <div ref={mapRef} className="relative w-full h-full z-0 min-h-[600px]" />

      <div className="absolute w-96 z-[1000] space-y-3" style={{ top: `${position.y}px`, left: `${position.x}px`, cursor: isDragging ? 'grabbing' : 'grab', resize: 'both', overflow: 'hidden', minWidth: '300px', minHeight: '200px' }}>
        <div className="bg-surface-dark/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent" onMouseDown={handleMouseDown}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">Incident Map</h2>
                <p className="text-xs text-gray-400">Lat/Lng plotted from current cases</p>
              </div>
              <span className="px-2 py-1 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                Google Maps
              </span>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-2 max-h-[320px] overflow-y-auto">
            {mapError && (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                {mapError}
              </div>
            )}
            {isLoadingMap && <p className="text-xs text-text-muted">Loading map…</p>}
            {INCIDENTS.map((incident) => (
              <button
                key={incident.id}
                onClick={() => {
                  if (mapInstance.current) {
                    mapInstance.current.panTo(incident.coords);
                    mapInstance.current.setZoom(14);
                    setSelected(incident.coords);
                  }
                }}
                className="w-full text-left border border-border-dark rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{incident.title}</p>
                    <p className="text-xs text-text-muted">{incident.address}</p>
                    <p className="text-[11px] text-text-muted">Lat {incident.coords.lat.toFixed(4)}, Lng {incident.coords.lng.toFixed(4)}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      incident.severity === 'Critical'
                        ? 'bg-red-500/20 text-red-400'
                        : incident.severity === 'High'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
