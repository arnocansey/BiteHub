"use client";

import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type GooglePlaceSelection = {
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

let googlePlacesScriptPromise: Promise<void> | null = null;

function ensureGooglePlacesScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if ((window as any).customElements?.get("gmpx-place-picker")) {
    return Promise.resolve();
  }

  if (googlePlacesScriptPromise) {
    return googlePlacesScriptPromise;
  }

  googlePlacesScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-bitehub-google-places="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google Places library.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js";
    script.dataset.bitehubGooglePlaces = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load Google Places library.")), {
      once: true
    });
    document.head.appendChild(script);
  });

  return googlePlacesScriptPromise;
}

function toLatLng(location: any) {
  if (!location) return null;
  const latitude = typeof location.lat === "function" ? location.lat() : location.lat;
  const longitude = typeof location.lng === "function" ? location.lng() : location.lng;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return { latitude, longitude };
}

export function GooglePlacesPanel({
  title,
  description,
  onPlaceSelect,
  heightClassName = "h-[300px]"
}: {
  title: string;
  description: string;
  onPlaceSelect?: (place: GooglePlaceSelection | null) => void;
  heightClassName?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const resolvedApiKey = apiKey ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceSelection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setLoadError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the admin dashboard environment to enable Places search.");
      return;
    }

    let isDisposed = false;
    let placePicker: HTMLElement | null = null;

    async function init() {
      try {
        await ensureGooglePlacesScript();
        await Promise.all([
          customElements.whenDefined("gmp-map"),
          customElements.whenDefined("gmpx-place-picker")
        ]);

        if (!mountRef.current || isDisposed) return;
        const mount = mountRef.current;
        mount.innerHTML = "";

        const loader = document.createElement("gmpx-api-loader");
        loader.setAttribute("key", resolvedApiKey);
        loader.setAttribute("solution-channel", "GMP_GE_mapsandplacesautocomplete_v2");

        const map = document.createElement("gmp-map") as any;
        map.setAttribute("center", "5.6037,-0.1870");
        map.setAttribute("zoom", "11");
        map.setAttribute("map-id", mapId);

        const control = document.createElement("div");
        control.setAttribute("slot", "control-block-start-inline-start");
        control.className = "place-picker-container";

        placePicker = document.createElement("gmpx-place-picker");
        placePicker.setAttribute("placeholder", "Search for an address or landmark");
        control.appendChild(placePicker);

        const marker = document.createElement("gmp-advanced-marker") as any;
        map.appendChild(control);
        map.appendChild(marker);

        mount.appendChild(loader);
        mount.appendChild(map);

        const infoWindow = new (window as any).google.maps.InfoWindow();
        map.innerMap?.setOptions?.({
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        const handlePlaceChange = () => {
          const place = (placePicker as any)?.value;
          const latLng = toLatLng(place?.location);

          if (!place || !latLng) {
            infoWindow.close();
            marker.position = null;
            setSelectedPlace(null);
            onPlaceSelect?.(null);
            return;
          }

          if (place.viewport) {
            map.innerMap.fitBounds(place.viewport);
          } else {
            map.center = place.location;
            map.zoom = 17;
          }

          marker.position = place.location;
          const nextPlace = {
            displayName: place.displayName ?? place.name ?? "Selected place",
            formattedAddress: place.formattedAddress ?? "Address unavailable",
            latitude: latLng.latitude,
            longitude: latLng.longitude
          };
          setSelectedPlace(nextPlace);
          onPlaceSelect?.(nextPlace);

          infoWindow.setContent(
            `<strong>${nextPlace.displayName}</strong><br><span>${nextPlace.formattedAddress}</span>`
          );
          infoWindow.open(map.innerMap, marker);
        };

        placePicker.addEventListener("gmpx-placechange", handlePlaceChange);
      } catch (error) {
        if (!isDisposed) {
          setLoadError(error instanceof Error ? error.message : "Unable to load Google Places search.");
        }
      }
    }

    void init();

    return () => {
      isDisposed = true;
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
    };
  }, [apiKey, mapId, onPlaceSelect, resolvedApiKey]);

  return (
    <article className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <div className={`mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-[#07101d] ${heightClassName}`}>
        {loadError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-rose-300">{loadError}</div>
        ) : (
          <div ref={mountRef} className="h-full w-full [&_.place-picker-container]:p-4" />
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected place</p>
        {selectedPlace ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-white">{selectedPlace.displayName}</p>
            <p className="text-slate-400">{selectedPlace.formattedAddress}</p>
            <p className="inline-flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-orange-300" />
              {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Pick an address to center the map and capture its coordinates.</p>
        )}
      </div>
    </article>
  );
}
