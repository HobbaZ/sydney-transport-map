import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";

type Vehicle = {
  id: string;
  lat: number;
  lon: number;
  route?: string | null;
  timestamp?: number | null;
  bearing?: number;
};

type AnimatedVehicle = Vehicle & {
  prevLat: number;
  prevLon: number;
};

type VehicleMap = Record<string, AnimatedVehicle>;

function getBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function createVehicleIcon(bearing: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        transform: rotate(${bearing}deg);
        font-size: 20px;
      ">
        🚌
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function useVehicles(): Vehicle[] {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const prevVehiclesRef = useRef<VehicleMap>({});
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (vehicleMap: VehicleMap, startTime: number) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const duration = 10000;

      const step = () => {
        const now = Date.now();
        const t = Math.min((now - startTime) / duration, 1);
        const progress = t * (2 - t);

        const interpolated: Vehicle[] = Object.values(vehicleMap).map((v) => {
          const lat = v.prevLat + (v.lat - v.prevLat) * progress;
          const lon = v.prevLon + (v.lon - v.prevLon) * progress;

          const bearing = getBearing(v.prevLat, v.prevLon, v.lat, v.lon);

          return {
            ...v,
            lat,
            lon,
            bearing,
          };
        });

        setVehicles(interpolated);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        }
      };

      step();
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return vehicles;
}

export default function Map() {
  const vehicles = useVehicles();

  return (
    <MapContainer
      center={[-33.8688, 151.2093]}
      zoom={12}
      style={{ height: "100vh" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {vehicles.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lon]}
          icon={createVehicleIcon(v.bearing || 0)}
        />
      ))}
    </MapContainer>
  );
}
