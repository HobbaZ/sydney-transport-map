import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useState } from "react";
import { VehicleMarkers } from "./vehicleMarkers";
import RoutesLayer from "./RoutesLayer";
import useVehicles from "./useVehicles";
import normalizeRoute from "./normalizeRoute";

export default function MapView() {
  const [routes, setRoutes] = useState<Record<string, RouteShape>>({});

  useEffect(() => {
    const fetchRoutes = async () => {
      const res = await fetch("http://localhost:3001/api/routes");
      const data = await res.json();
      setRoutes(data);
    };

    fetchRoutes();
  }, []);

  const vehicles = useVehicles(routes);

  const routeColorMap = useMemo(() => {
    const map = new Map<string, string>();

    Object.entries(routes).forEach(([routeId, route]) => {
      const key = normalizeRoute(routeId);
      if (key) {
        map.set(key, route.color || "#888");
      }
    });

    return map;
  }, [routes]);

  return (
    <MapContainer
      center={[-33.8688, 151.2093]}
      zoom={12}
      style={{ height: "100vh" }}
    >
      <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

      <RoutesLayer routes={routes} routeColorMap={routeColorMap} />

      <VehicleMarkers vehicles={vehicles} routeColorMap={routeColorMap} />
    </MapContainer>
  );
}
