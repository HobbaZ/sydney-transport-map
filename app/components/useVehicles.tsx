import { useRef, useState, useEffect } from "react";
import { getPointAtDistance, snapToRoute } from "./distanceUtils";
import type { Vehicle, RouteShape, LiveVehicle } from "./types";

export function useVehicleFeed() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const prevRef = useRef<Record<string, LiveVehicle>>({});

  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await fetch("/api/vehicles");
      const data: any[] = await res.json();

      const now = Date.now();
      const prev = prevRef.current;
      const next: Record<string, LiveVehicle> = {};

      for (const v of data) {
        const old = prev[v.id];

        next[v.id] = {
          id: v.id,

          // previous position
          prevLat: old?.lat ?? v.lat,
          prevLon: old?.lon ?? v.lon,

          // new target position (API truth)
          lat: v.lat,
          lon: v.lon,
          targetLat: v.lat,
          targetLon: v.lon,

          lastUpdate: now,
          speed: v.speed ?? old?.speed ?? 0,
        };
      }

      prevRef.current = next;
      setVehicles(Object.values(next));
    };

    fetchVehicles();
    const id = setInterval(fetchVehicles, 5000);

    return () => clearInterval(id);
  }, []);

  return vehicles;
}

export function useVehicleInterpolation(apiVehicles: LiveVehicle[]) {
  const [rendered, setRendered] = useState(apiVehicles);

  const latestRef = useRef(apiVehicles);

  useEffect(() => {
    latestRef.current = apiVehicles;
  }, [apiVehicles]);

  useEffect(() => {
    let running = true;

    const animate = () => {
      const now = Date.now();

      const updated = latestRef.current.map((v) => {
        const dt = Math.min((now - v.lastUpdate) / 1000, 1);

        // simple linear interpolation
        const lat = v.prevLat + (v.lat - v.prevLat) * dt;

        const lon = v.prevLon + (v.lon - v.prevLon) * dt;

        return {
          ...v,
          lat,
          lon,
        };
      });

      setRendered(updated);

      if (running) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      running = false;
    };
  }, []);

  return rendered;
}
