import { useEffect, useRef, useState } from "react";

export function useLiveVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const latestRef = useRef<any[]>([]);

  // 1. API polling
  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await fetch("/api/vehicles");
      const data = await res.json();

      const now = Date.now();

      latestRef.current = data.map((v: any) => ({
        ...v,
        prevLat: v.lat,
        prevLon: v.lon,
        targetLat: v.lat,
        targetLon: v.lon,
        lastUpdate: now,
      }));
    };

    fetchVehicles();
    const id = setInterval(fetchVehicles, 5000);

    return () => clearInterval(id);
  }, []);

  // 2. interpolation loop
  useEffect(() => {
    let running = true;

    const animate = () => {
      const now = Date.now();

      const updated = latestRef.current.map((v) => {
        const dt = Math.min((now - v.lastUpdate) / 1000, 1);

        return {
          ...v,
          lat: v.prevLat + (v.targetLat - v.prevLat) * dt,
          lon: v.prevLon + (v.targetLon - v.prevLon) * dt,
        };
      });

      setVehicles(updated);

      if (running) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      running = false;
    };
  }, []);

  return vehicles;
}
