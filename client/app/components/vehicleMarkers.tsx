import { Marker } from "react-leaflet";
import { useMapBounds } from "./useMapBounds";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useMemo } from "react";

type Vehicle = {
  id: string;
  lat: number;
  lon: number;
  route?: string | null;
};

export function VehicleMarkers({
  vehicles,
  createVehicleIcon,
}: {
  vehicles: Vehicle[];
  createVehicleIcon: (route?: string | null) => any;
}) {
  const bounds = useMapBounds(); // ✅ FIXED (inside component)

  const visibleVehicles = useMemo(() => {
    if (!bounds) return [];

    const paddedBounds = bounds.pad(0.2);

    return vehicles.filter((v) => paddedBounds.contains([v.lat, v.lon]));
  }, [vehicles, bounds]);

  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
      {visibleVehicles.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lon]}
          icon={createVehicleIcon(v.route)}
        />
      ))}
    </MarkerClusterGroup>
  );
}
