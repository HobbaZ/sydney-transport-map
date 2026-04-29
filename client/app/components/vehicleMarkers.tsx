import { Marker } from "react-leaflet";
import { useMapBounds } from "./useMapBounds";
import React, { useMemo } from "react";
import { createVehicleIcon } from "./createVehicleIcons";
import normalizeRoute from "./normalizeRoute";

export const VehicleMarkers = React.memo(function VehicleMarkers({
  vehicles,
  routeColorMap,
}: {
  vehicles: Vehicle[];
  routeColorMap: Map<string, string>;
}) {
  const bounds = useMapBounds();

  const iconCache = useMemo(() => new Map(), []);

  const getIcon = (route: string | null | undefined) => {
    const key = normalizeRoute(route) || "default";

    if (!iconCache.has(key)) {
      iconCache.set(key, createVehicleIcon(route, routeColorMap));
    }

    return iconCache.get(key);
  };

  const visibleVehicles = useMemo(() => {
    if (!bounds) return [];

    const paddedBounds = bounds.pad(0.2);

    return vehicles.filter((v) => paddedBounds.contains([v.lat, v.lon]));
  }, [vehicles, bounds]);

  return (
    <>
      {visibleVehicles.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lon]}
          icon={getIcon(normalizeRoute(v.route))}
        />
      ))}
    </>
  );
});
