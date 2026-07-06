import { useEffect, useState } from "react";
import { useLiveVehicles } from "./useLiveVehicles";

type Props = {
  routes: Record<string, RouteShape>;
};

export default function MapClient({ routes }: Props) {
  const [MapComponent, setMapComponent] = useState<any>(null);
  const vehicles = useLiveVehicles();

  useEffect(() => {
    import("./Map").then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) return <div>Loading map...</div>;

  return <MapComponent routes={routes} vehicles={vehicles} />;
}
