"use client";

import { useEffect, useRef, useState } from "react";
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

type RestaurantMarker = {
  id: string;
  name: string;
  address?: string | null;
  averageRating?: number | null;
  isFeatured?: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

type SearchLocation = {
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const configuredMapboxStyleId = process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID?.trim();
const mapboxUseCustomStyle = process.env.NEXT_PUBLIC_MAPBOX_USE_CUSTOM_STYLE?.trim().toLowerCase() === "true";
const mapboxStyleId = mapboxUseCustomStyle && configuredMapboxStyleId ? configuredMapboxStyleId : "mapbox/dark-v11";

function createOpenStreetMapLayer() {
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  });
}

function createMapboxLayer() {
  if (!mapboxAccessToken) return null;

  return L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxAccessToken}`, {
    attribution:
      '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    crossOrigin: true
  });
}

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

export function getZoneCoordinates(zoneLabel: string, index: number) {
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
  restaurants,
  searchLocation,
  focusedZoneId,
  focusedRiderId,
  focusedRestaurantId,
  onZoneSelect,
  onRiderSelect,
  onRestaurantSelect
}: {
  zones: HeatZone[];
  activeRiders: ActiveRider[];
  restaurants?: RestaurantMarker[];
  searchLocation?: SearchLocation | null;
  focusedZoneId?: string | null;
  focusedRiderId?: string | null;
  focusedRestaurantId?: string | null;
  onZoneSelect?: (zoneId: string | null) => void;
  onRiderSelect?: (riderId: string | null) => void;
  onRestaurantSelect?: (restaurantId: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hasSwappedTileLayerRef = useRef(false);
  const [isUsingFallbackTiles, setIsUsingFallbackTiles] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [7.9465, -1.0232],
      zoom: 6,
      scrollWheelZoom: false,
      zoomControl: false
    });

    const swapToFallbackTiles = () => {
      if (hasSwappedTileLayerRef.current) return;
      hasSwappedTileLayerRef.current = true;
      setIsUsingFallbackTiles(true);

      tileLayerRef.current?.removeFrom(map);
      const fallbackLayer = createOpenStreetMapLayer();
      fallbackLayer.addTo(map);
      tileLayerRef.current = fallbackLayer;
    };

    const tileLayer = createMapboxLayer() ?? createOpenStreetMapLayer();
    if (mapboxAccessToken) {
      tileLayer.on("tileerror", swapToFallbackTiles);
    } else {
      setIsUsingFallbackTiles(true);
    }

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const invalidate = () => map.invalidateSize();
    const resizeTimer = window.setTimeout(invalidate, 120);
    const animationFrame = window.requestAnimationFrame(invalidate);
    const handleWindowResize = () => invalidate();
    window.addEventListener("resize", handleWindowResize);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            invalidate();
          })
        : null;

    resizeObserver?.observe(containerRef.current);

    return () => {
      window.clearTimeout(resizeTimer);
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver?.disconnect();
      layerGroupRef.current?.clearLayers();
      tileLayerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      tileLayerRef.current = null;
      hasSwappedTileLayerRef.current = false;
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

      marker.on("click", () => {
        onZoneSelect?.(zone.id);
      });

      marker.addTo(layerGroup);
    });

    activeRiders.forEach((rider) => {
      const riderName = [rider.user?.firstName, rider.user?.lastName].filter(Boolean).join(" ").trim() || "Active rider";
      const riderStatusLabel = `${rider.vehicleType ?? "Rider"} | Online`;
      const riderDeliveryLabel = rider.activeDelivery?.restaurantName
        ? `On delivery for ${rider.activeDelivery.restaurantName}`
        : "Available for assignment";

      const marker = L.circleMarker([rider.currentLatitude, rider.currentLongitude], {
        radius: rider.id === focusedRiderId ? 8 : 6,
        color: "#38bdf8",
        weight: rider.id === focusedRiderId ? 3 : 2,
        fillColor: "#0ea5e9",
        fillOpacity: 0.95
      });

      marker.bindTooltip(
        `<div style="min-width: 160px;">
          <div style="font-weight:700; margin-bottom:4px;">${riderName}</div>
          <div style="font-size:12px; color:#cbd5e1;">${riderStatusLabel}</div>
          <div style="font-size:12px; color:#cbd5e1;">${riderDeliveryLabel}</div>
        </div>`,
        {
          direction: "top",
          offset: [0, -6]
        }
      );

      marker.on("click", () => {
        onRiderSelect?.(rider.id);
      });

      marker.addTo(layerGroup);
    });

    (restaurants ?? []).forEach((restaurant, index) => {
      const coords =
        typeof restaurant.latitude === "number" && typeof restaurant.longitude === "number"
          ? { lat: restaurant.latitude, lng: restaurant.longitude }
          : getZoneCoordinates(`${restaurant.address ?? ""} ${restaurant.name}`.trim() || restaurant.name, index);
      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: restaurant.id === focusedRestaurantId ? 7 : 5,
        color: restaurant.isFeatured ? "#f59e0b" : "#a855f7",
        weight: restaurant.id === focusedRestaurantId ? 3 : 2,
        fillColor: restaurant.isFeatured ? "#fbbf24" : "#c084fc",
        fillOpacity: 0.9
      });

      marker.bindTooltip(
        `<div style="min-width: 160px;">
          <div style="font-weight:700; margin-bottom:4px;">${restaurant.name}</div>
          <div style="font-size:12px; color:#cbd5e1;">${restaurant.address ?? "Address pending"}</div>
          <div style="font-size:12px; color:#cbd5e1;">${restaurant.averageRating ? `Rating ${restaurant.averageRating.toFixed(1)}` : "Rating pending"}</div>
        </div>`,
        {
          direction: "top",
          offset: [0, -6]
        }
      );

      marker.on("click", () => {
        onRestaurantSelect?.(restaurant.id);
      });

      marker.addTo(layerGroup);
    });

    if (searchLocation) {
      const marker = L.circleMarker([searchLocation.latitude, searchLocation.longitude], {
        radius: 9,
        color: "#f8fafc",
        weight: 3,
        fillColor: "#f59e0b",
        fillOpacity: 0.95
      });

      marker.bindTooltip(
        `<div style="min-width: 180px;">
          <div style="font-weight:700; margin-bottom:4px;">${searchLocation.displayName}</div>
          <div style="font-size:12px; color:#cbd5e1;">${searchLocation.formattedAddress}</div>
        </div>`,
        {
          direction: "top",
          permanent: true,
          offset: [0, -6]
        }
      );

      marker.addTo(layerGroup);
    }
  }, [
    activeRiders,
    focusedRestaurantId,
    focusedRiderId,
    focusedZoneId,
    onRestaurantSelect,
    onRiderSelect,
    onZoneSelect,
    restaurants,
    searchLocation,
    zones
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const focusedRider = activeRiders.find((rider) => rider.id === focusedRiderId);
    if (focusedRider) {
      map.flyTo([focusedRider.currentLatitude, focusedRider.currentLongitude], Math.max(map.getZoom(), 8), { duration: 0.35 });
      return;
    }

    if (searchLocation) {
      map.flyTo([searchLocation.latitude, searchLocation.longitude], Math.max(map.getZoom(), 13), {
        duration: 0.35
      });
      return;
    }

    const focusedRestaurant = (restaurants ?? []).find((restaurant) => restaurant.id === focusedRestaurantId);
    if (focusedRestaurant) {
      const restaurantIndex = (restaurants ?? []).findIndex((restaurant) => restaurant.id === focusedRestaurantId);
      const coords =
        typeof focusedRestaurant.latitude === "number" && typeof focusedRestaurant.longitude === "number"
          ? { lat: focusedRestaurant.latitude, lng: focusedRestaurant.longitude }
          : getZoneCoordinates(
              `${focusedRestaurant.address ?? ""} ${focusedRestaurant.name}`.trim(),
              Math.max(0, restaurantIndex)
            );
      map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 8), { duration: 0.35 });
      return;
    }

    const focusedZone = zones.find((zone) => zone.id === focusedZoneId);
    if (focusedZone) {
      const zoneIndex = zones.findIndex((zone) => zone.id === focusedZoneId);
      const coords = getZoneCoordinates(focusedZone.zoneLabel, Math.max(0, zoneIndex));
      map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 7), { duration: 0.35 });
    }
  }, [activeRiders, focusedRestaurantId, focusedRiderId, focusedZoneId, restaurants, searchLocation, zones]);

  return (
    <div className="relative mt-6 overflow-hidden rounded-[28px] border border-slate-700 bg-[#07101d]">
      <div ref={containerRef} className="h-[360px] w-full md:h-[440px] xl:h-[500px]" />

      {isUsingFallbackTiles ? (
        <div className="absolute right-4 top-4 z-[1200] rounded-full border border-amber-400/30 bg-slate-950/90 px-3 py-1.5 text-[11px] font-medium text-amber-200 shadow-lg backdrop-blur">
          Mapbox tiles unavailable, using OpenStreetMap fallback
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 z-[1200] rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 shadow-xl backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Heat key</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Red zone</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Warm zone</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Balanced</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Active riders</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-400" /> Restaurants</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Place search</span>
        </div>
      </div>
    </div>
  );
}
