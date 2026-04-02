"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type HeatZone = {
  id: string;
  zoneLabel: string;
  demandLevel: number;
  supplyLevel: number;
  activeOrders: number;
};

type ActiveRider = {
  id: string;
  isOnline: boolean;
  vehicleType?: string | null;
  currentLatitude: number;
  currentLongitude: number;
  user?: { firstName?: string; lastName?: string } | null;
  activeDelivery?: {
    id: string;
    status: string;
    orderId: string;
    restaurantName?: string | null;
  } | null;
};

const ghanaZoneCoordinates = [
  { keywords: ["accra", "osu", "airport", "cantonments", "labone"], lat: 5.5607, lng: -0.2057 },
  { keywords: ["tema", "spintex", "sakumono", "ashaiman"], lat: 5.6698, lng: -0.0166 },
  { keywords: ["kasoa", "weija", "mallam"], lat: 5.5345, lng: -0.4168 },
  { keywords: ["madina", "east legon", "adenta", "legon"], lat: 5.6654, lng: -0.1644 },
  { keywords: ["kumasi", "suame", "asokwa", "knust"], lat: 6.6885, lng: -1.6244 },
  { keywords: ["cape coast"], lat: 5.1053, lng: -1.2466 },
  { keywords: ["takoradi", "sekondi", "western"], lat: 4.8962, lng: -1.7581 },
  { keywords: ["sunyani", "brong", "ahafo"], lat: 7.3399, lng: -2.3268 },
  { keywords: ["ho", "volta", "hohoe"], lat: 6.6008, lng: 0.4713 },
  { keywords: ["koforidua", "eastern"], lat: 6.0941, lng: -0.2591 },
  { keywords: ["tamale", "northern"], lat: 9.4075, lng: -0.8533 },
  { keywords: ["bolgatanga", "upper east"], lat: 10.7856, lng: -0.8514 },
  { keywords: ["wa", "upper west"], lat: 10.0601, lng: -2.5089 }
] as const;

function getZonePressure(zone: HeatZone) {
  return Number(zone.demandLevel ?? 0) - Number(zone.supplyLevel ?? 0) + Number(zone.activeOrders ?? 0) * 0.35;
}

function getZoneStyle(zone: HeatZone) {
  const pressure = getZonePressure(zone);
  if (pressure >= 6) {
    return { fill: "#f43f5e", stroke: "#fb7185", label: "Red zone" };
  }
  if (pressure >= 3.5) {
    return { fill: "#fb923c", stroke: "#fdba74", label: "Warm zone" };
  }
  return { fill: "#34d399", stroke: "#6ee7b7", label: "Balanced" };
}

function getZoneCoordinates(zoneLabel: string, index: number) {
  const normalized = zoneLabel.toLowerCase();
  const matched = ghanaZoneCoordinates.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));
  if (matched) return { lat: matched.lat, lng: matched.lng };

  const fallback = [
    { lat: 5.6037, lng: -0.187 },
    { lat: 6.6885, lng: -1.6244 },
    { lat: 9.4075, lng: -0.8533 },
    { lat: 5.1053, lng: -1.2466 },
    { lat: 6.0941, lng: -0.2591 },
    { lat: 7.3399, lng: -2.3268 }
  ];

  return fallback[index % fallback.length];
}

export function GhanaDispatchMap({
  zones,
  activeRiders,
  focusedZoneId
}: {
  zones: HeatZone[];
  activeRiders: ActiveRider[];
  focusedZoneId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [7.9465, -1.0232],
      zoom: 6,
      scrollWheelZoom: false,
      zoomControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      layerGroupRef.current?.clearLayers();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    zones.forEach((zone, index) => {
      const coords = getZoneCoordinates(zone.zoneLabel, index);
      const style = getZoneStyle(zone);
      const pressure = getZonePressure(zone);
      const isFocused = zone.id === focusedZoneId;

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: Math.max(10, Math.min(26, 10 + pressure * 1.6)),
        color: style.stroke,
        weight: isFocused ? 3 : 2,
        fillColor: style.fill,
        fillOpacity: isFocused ? 0.75 : 0.58
      });

      marker.bindTooltip(
        `<div style="min-width: 150px;">
          <div style="font-weight:700; margin-bottom:4px;">${zone.zoneLabel}</div>
          <div style="font-size:12px; color:#cbd5e1;">${style.label}</div>
          <div style="font-size:12px; color:#cbd5e1;">Demand ${zone.demandLevel}/10, Supply ${zone.supplyLevel}/10</div>
          <div style="font-size:12px; color:#cbd5e1;">${zone.activeOrders} active deliveries</div>
        </div>`,
        {
          direction: "top",
          permanent: isFocused,
          offset: [0, -8]
        }
      );

      marker.addTo(layerGroup);
    });

    activeRiders.forEach((rider) => {
      const riderName = [rider.user?.firstName, rider.user?.lastName].filter(Boolean).join(" ").trim() || "Active rider";
      const marker = L.circleMarker([rider.currentLatitude, rider.currentLongitude], {
        radius: 6,
        color: "#38bdf8",
        weight: 2,
        fillColor: "#0ea5e9",
        fillOpacity: 0.95
      });

      marker.bindTooltip(
        `<div style="min-width: 160px;">
          <div style="font-weight:700; margin-bottom:4px;">${riderName}</div>
          <div style="font-size:12px; color:#cbd5e1;">${rider.vehicleType ?? "Rider"} · Online</div>
          <div style="font-size:12px; color:#cbd5e1;">${rider.activeDelivery?.restaurantName ? `On delivery for ${rider.activeDelivery.restaurantName}` : "Available for assignment"}</div>
        </div>`,
        {
          direction: "top",
          offset: [0, -6]
        }
      );

      marker.addTo(layerGroup);
    });
  }, [activeRiders, focusedZoneId, zones]);

  return (
    <div className="relative mt-6 overflow-hidden rounded-[28px] border border-slate-700 bg-[#07101d]">
      <div ref={containerRef} className="h-[360px] w-full md:h-[440px] xl:h-[500px]" />

      <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Heat key</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Red zone</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Warm zone</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Balanced</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Active riders</span>
        </div>
      </div>
    </div>
  );
}
