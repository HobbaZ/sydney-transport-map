import { useRef, useState, useEffect } from "react";
import normalizeRoute from "./normalizeRoute";
import L from "leaflet";
import { getPointAtDistance, snapToRoute } from "./distanceUtils";
import type { Vehicle, RouteShape } from "./types";

export default function useVehicles(routes: Record<string, RouteShape>) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const prevRef = useRef<VehicleMap>({});
  const rafRef = useRef<number | null>(null);
  const lastRenderRef = useRef(0);
  const duration = 10000;

  useEffect(() => {
    let running = true;

    const animate = () => {
      const now = Date.now();
      const map = prevRef.current;

      const updated = Object.values(map).map((v) => {
        const routeKey = normalizeRoute(v.route);
        const route = routeKey ? routes[routeKey] : null;

        if (!route || !route.points) return v;

        const elapsed = now - (v.timestamp ?? now);

        let dist = v.distAlong + v.speed * elapsed;

        const pos = getPointAtDistance(route.points, dist);

        return {
          ...v,
          lat: pos.lat,
          lon: pos.lon,
        };
      });

      if (now - lastRenderRef.current > 100) {
        setVehicles(updated); // render ~10 FPS
        lastRenderRef.current = now;
      }

      if (running) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [routes]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await fetch("http://localhost:3001/api/vehicles");
      const data: Vehicle[] = await res.json();

      const prev = prevRef.current;
      const next: VehicleMap = {};
      const now = Date.now();

      data.forEach((v) => {
        if (!v.lat || !v.lon) return;

        const routeKey = normalizeRoute(v.route);
        const route = routeKey ? routes[routeKey] : null;

        let snapped = null;
        if (route) {
          snapped = snapToRoute(v, route.points);

          if (snapped && snapped.distance > 0.01) {
            snapped = null;
          }
        }

        const prevV = prev[v.id];

        let distAlong = snapped?.distAlong ?? prevV?.distAlong ?? 0;

        let speed = prevV?.speed ?? 0;

        if (prevV && prevV.timestamp) {
          const dt = now - prevV.timestamp;

          if (dt > 0) {
            const delta = distAlong - prevV.distAlong;

            const MAX_DELTA = 0.02; // tune this

            if (delta >= 0 && delta < MAX_DELTA) {
              // valid forward movement → update speed smoothly
              const newSpeed = delta / dt;
              speed = speed * 0.8 + newSpeed * 0.2;
            } else {
              // invalid jump → ignore update
              distAlong = prevV.distAlong;
            }
          }
        }

        next[v.id] = {
          ...v,
          timestamp: now,

          prevLat: prevV?.lat ?? v.lat,
          prevLon: prevV?.lon ?? v.lon,

          distAlong,
          prevDistAlong: prevV?.distAlong ?? distAlong,
          speed,
        };
      });

      prevRef.current = next;
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 10000);

    return () => clearInterval(interval);
  }, [routes]);

  return vehicles;
}
