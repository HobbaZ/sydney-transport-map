import { useRef, useState, useEffect } from "react";
import { getPointAtDistance, snapToRoute } from "./distanceUtils";
import type { RouteShape, LiveVehicle } from "./types";

type VehicleState = LiveVehicle & {
  distAlong: number;
  targetDistAlong: number;
  speed: number;
  timestamp: number;
};

export function useVehicleFeed(routes: Record<string, RouteShape>) {
  const [vehicles, setVehicles] = useState<VehicleState[]>([]);

  const prevRef = useRef<Record<string, VehicleState>>({});

  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await fetch("/api/vehicles");

      const data = await res.json();

      const now = Date.now();

      const prev = prevRef.current;

      const next: Record<string, VehicleState> = {};

      for (const v of data) {
        const old = prev[v.id];

        const route = v.routeId ? routes[v.routeId] : null;

        let distAlong = old?.targetDistAlong ?? 0;

        if (route) {
          const snapped = snapToRoute(v, route);

          // ignore GPS points too far from track
          if (snapped && snapped.distance < 0.01) {
            distAlong = snapped.distAlong;
          }
        }

        let speed = old?.speed ?? 0;

        if (old) {
          const elapsed = (now - old.timestamp) / 1000;

          if (elapsed > 0) {
            const delta = distAlong - old.targetDistAlong;

            if (delta >= 0 && delta < 0.02) {
              const measured = delta / elapsed;

              // smooth speed changes
              speed = speed * 0.8 + measured * 0.2;
            }
          }
        }

        next[v.id] = {
          ...v,

          distAlong: old?.distAlong ?? distAlong,

          targetDistAlong: distAlong,

          speed,

          timestamp: now,
        };
      }

      prevRef.current = next;

      setVehicles(Object.values(next));
    };

    fetchVehicles();

    const timer = setInterval(fetchVehicles, 5000);

    return () => clearInterval(timer);
  }, [routes]);

  return vehicles;
}

export function useVehicleInterpolation(
  apiVehicles: VehicleState[],
  routes: Record<string, RouteShape>,
) {
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
        const route = v.routeId ? routes[v.routeId] : null;

        if (!route) {
          return v;
        }

        const elapsed = (now - v.timestamp) / 1000;

        let dist = v.distAlong + v.speed * elapsed;

        // gently correct toward GPS
        const correction = (v.targetDistAlong - dist) * 0.05;

        dist += correction;

        const pos = getPointAtDistance(route, dist);

        return {
          ...v,

          lat: pos.lat,

          lon: pos.lon,

          distAlong: dist,
        };
      });

      setRendered(updated);

      if (running) {
        requestAnimationFrame(animate);
      }
    };

    const frame = requestAnimationFrame(animate);

    return () => {
      running = false;

      cancelAnimationFrame(frame);
    };
  }, [routes]);

  return rendered;
}
