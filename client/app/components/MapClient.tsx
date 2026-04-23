import { useEffect, useState } from "react";

export default function MapClient() {
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    import("./Map").then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) return <div>Loading map...</div>;

  return <MapComponent />;
}
