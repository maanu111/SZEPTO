"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DetectedLocation = {
  label: string;
  /** Full one-line address, or coordinates if reverse geocoding failed. */
  line: string;
  lat: number;
  lon: number;
  detectedAt: string;
};

export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "error" | "unsupported";

const STORAGE_KEY = "szepto.location.v1";

function readCached(): DetectedLocation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DetectedLocation) : null;
  } catch {
    return null;
  }
}

/** Turns Nominatim's address parts into a short, India-style delivery line. */
function formatAddress(data: {
  address?: Record<string, string>;
  display_name?: string;
}): { label: string; line: string } {
  const a = data.address ?? {};

  const locality =
    a.neighbourhood ?? a.suburb ?? a.residential ?? a.quarter ?? a.village ?? a.town ?? "";
  const city = a.city ?? a.town ?? a.state_district ?? a.county ?? "";
  const road = a.road ?? "";
  const postcode = a.postcode ?? "";

  const parts = [road, locality, city, postcode].filter(Boolean);
  const line = parts.length ? Array.from(new Set(parts)).join(", ") : (data.display_name ?? "");

  return { label: locality || city || "Current location", line };
}

async function reverseGeocode(lat: number, lon: number, signal: AbortSignal) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
  return res.json();
}

/**
 * Detects the visitor's real location and resolves it to a readable address.
 *
 * Auto-runs on mount only when permission was already granted, so returning visitors
 * see their address immediately without an unprompted permission dialog on first load.
 */
export function useCurrentLocation() {
  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Location isn't supported in this browser.");
      return;
    }

    setStatus("locating");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        let label = "Current location";
        let line = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        try {
          const data = await reverseGeocode(lat, lon, controller.signal);
          const formatted = formatAddress(data);
          if (formatted.line) {
            label = formatted.label;
            line = formatted.line;
          }
        } catch (e) {
          // Keep the coordinates as the fallback line; this isn't fatal.
          if ((e as Error).name === "AbortError") return;
        }

        const next: DetectedLocation = {
          label,
          line,
          lat,
          lon,
          detectedAt: new Date().toISOString(),
        };
        setLocation(next);
        setStatus("ready");
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Storage full or blocked — detection still worked for this session.
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Location permission was blocked. Allow it in your browser to detect again.");
        } else if (err.code === err.TIMEOUT) {
          setStatus("error");
          setError("Timed out finding your location. Try again.");
        } else {
          setStatus("error");
          setError("Couldn't determine your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  // Restore the last known address, then detect automatically on load.
  useEffect(() => {
    const cached = readCached();
    if (cached) {
      // Restoring browser state after hydration intentionally updates this client hook.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation(cached);
      setStatus("ready");
    }

    if (typeof navigator === "undefined") return;

    let cancelled = false;

    // Run after hydration so first-time visitors receive the browser permission prompt
    // automatically; getCurrentPosition handles denied and unavailable states below.
    const detectFrame = requestAnimationFrame(() => {
      if (!cancelled) detect();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(detectFrame);
      abortRef.current?.abort();
    };
  }, [detect]);

  return { location, status, error, detect };
}

export type DetectedAddress = {
  /** Street-level line suitable for the address field. */
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

export type DetectResult =
  | ({ ok: true } & DetectedAddress)
  | { ok: false; error: string };

/**
 * One-shot address detection.
 *
 * The hook above drives the header's location chip and keeps state; forms need
 * a plain promise that either resolves to fields they can drop straight into
 * inputs, or explains why it couldn't.
 */
export async function detectAddress(): Promise<DetectResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, error: "Location isn't supported in this browser." };
  }

  const position = await new Promise<GeolocationPosition | GeolocationPositionError>((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      (e) => resolve(e),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  );

  if (!("coords" in position)) {
    return {
      ok: false,
      error:
        position.code === position.PERMISSION_DENIED
          ? "Location permission was blocked. Type your address instead."
          : "Couldn't get your location. Type your address instead.",
    };
  }

  const { latitude, longitude } = position.coords;

  try {
    const data = await reverseGeocode(latitude, longitude, new AbortController().signal);
    const a = (data.address ?? {}) as Record<string, string>;
    const { line } = formatAddress(data);
    return {
      ok: true,
      address: line,
      city: a.city ?? a.town ?? a.state_district ?? a.county ?? "",
      pincode: a.postcode ?? "",
      latitude,
      longitude,
    };
  } catch {
    // Coordinates are still useful even when the lookup fails.
    return {
      ok: true,
      address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      city: "",
      pincode: "",
      latitude,
      longitude,
    };
  }
}
