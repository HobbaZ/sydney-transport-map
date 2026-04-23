import { useMemo } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { VehicleMarkers } from "./vehicleMarkers";
import { getRouteColor } from "./colours";
import RoutesLayer from "./RoutesLayer";

type Vehicle = {
  id: string;
  lat: number;
  lon: number;
  route?: string | null;
  timestamp?: number | null;
};

type AnimatedVehicle = Vehicle & {
  prevLat: number;
  prevLon: number;
};

type VehicleMap = Record<string, AnimatedVehicle>;

function createVehicleIcon(route?: string | null) {
  const color = getRouteColor(route);

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function useVehicles(): Vehicle[] {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const prevVehiclesRef = useRef<VehicleMap>({});
  const animationRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const animate = (vehicleMap: VehicleMap, startTime: number) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      isAnimatingRef.current = true;
      lastUpdateRef.current = 0;

      const duration = 10000;

      const step = () => {
        if (!isAnimatingRef.current) return;

        const now = Date.now();
        const t = Math.min((now - startTime) / duration, 1);
        const progress = t * (2 - t);

        const interpolated: Vehicle[] = Object.values(vehicleMap).map((v) => {
          const lat = v.prevLat + (v.lat - v.prevLat) * progress;
          const lon = v.prevLon + (v.lon - v.prevLon) * progress;

          return { ...v, lat, lon };
        });

        // throttle updates (~20fps)
        if (now - lastUpdateRef.current > 50) {
          setVehicles(interpolated);
          lastUpdateRef.current = now;
        }

        if (t < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          isAnimatingRef.current = false;
        }
      };

      animationRef.current = requestAnimationFrame(step);
    };

    const fetchVehicles = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/vehicles");

        if (!res.ok) {
          const text = await res.text();
          console.error("API error:", text);
          return;
        }

        const data: Vehicle[] = await res.json();

        if (!Array.isArray(data)) {
          console.error("Invalid data format:", data);
          return;
        }

        const prev = prevVehiclesRef.current;
        const nextMap: VehicleMap = {};
        const now = Date.now();

        data.forEach((v) => {
          if (!v.lat || !v.lon) return;

          const prevV = prev[v.id];

          nextMap[v.id] = {
            ...v,
            prevLat: prevV ? prevV.lat : v.lat,
            prevLon: prevV ? prevV.lon : v.lon,
          };
        });

        prevVehiclesRef.current = nextMap;

        animate(nextMap, now);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 10000);

    return () => {
      clearInterval(interval);
      isAnimatingRef.current = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return vehicles;
}

export default function MapView() {
  const vehicles = useVehicles();
  const routeColorMap = useMemo(() => {
    const map = new Map<string, string>();

    vehicles.forEach((v) => {
      if (v.route && !map.has(v.route)) {
        map.set(v.route, getRouteColor(v.route));
      }
    });

    return map;
  }, [vehicles]);

  return (
    <MapContainer
      center={[-33.8688, 151.2093]}
      zoom={12}
      style={{ height: "100vh" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {vehicles.length > 0 && <RoutesLayer routeColorMap={routeColorMap} />}

      <VehicleMarkers
        vehicles={vehicles}
        createVehicleIcon={createVehicleIcon}
      />
    </MapContainer>
  );
}
