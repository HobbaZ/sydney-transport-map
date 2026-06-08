import { Marker, Popup } from "react-leaflet";
import { useMapBounds } from "./useMapBounds";
import React, { useMemo } from "react";
import { createVehicleIcon } from "./createVehicleIcons";

export const VehicleMarkers = React.memo(function VehicleMarkers({
  vehicles,
  routeColorMap,
}: {
  vehicles: Vehicle[];
  routeColorMap: Map<string, string>;
}) {
  const bounds = useMapBounds();
  const iconCache = useMemo(() => new Map(), []);

  const getRouteKey = (v: Vehicle) =>
    (v.routeShort || v.routeId || "").split("_")[0];

  const getIcon = (routeKey: string) => {
    if (!iconCache.has(routeKey)) {
      iconCache.set(routeKey, createVehicleIcon(routeKey, routeColorMap));
    }
    return iconCache.get(routeKey);
  };

  const visibleVehicles = useMemo(() => {
    if (!bounds) return [];
    const padded = bounds.pad(0.2);
    return vehicles.filter((v) => padded.contains([v.lat, v.lon]));
  }, [vehicles, bounds]);

  return (
    <>
      {visibleVehicles.map((v) => {
        const routeKey = getRouteKey(v);

        return (
          <Marker
            key={v.id} // IMPORTANT FIX
            position={[v.lat, v.lon]}
            icon={getIcon(routeKey)}
          >
            <Popup>
              <div>
                <h3>🚆 Train</h3>
                <p>
                  <b>Service:</b> {v.label || "Unknown"}
                </p>
                <p>
                  <b>Route:</b> {routeKey}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
});
