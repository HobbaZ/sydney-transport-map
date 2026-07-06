import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { VehicleMarkers } from "./vehicleMarkers";
import RoutesLayer from "./RoutesLayer";
import TrainLegend from "./lineColours";

type Props = {
  routes: Record<string, RouteShape>;
  vehicles: Vehicle[];
};

export default function MapView({ routes, vehicles }: Props) {
  //const vehicles = useVehicles(routes, vehiclesFromLoader);

  const routeColorMap = useMemo(() => {
    const map = new Map<string, string>();

    Object.values(routes).forEach((route) => {
      if (route.routeId) {
        map.set(route.routeId, route.color || "#888");
      }
    });

    return map;
  }, [routes]);

  return (
    <>
      <MapContainer
        center={[-33.8688, 151.2093]}
        zoom={12}
        style={{ height: "100vh" }}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

        <RoutesLayer routes={routes} routeColorMap={routeColorMap} />

        <VehicleMarkers vehicles={vehicles} routeColorMap={routeColorMap} />
      </MapContainer>

      <TrainLegend />
    </>
  );
}
