import { useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { LatLngBounds } from "leaflet";

export function useMapBounds() {
  const map = useMap();
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);

  useEffect(() => {
    let frame: number | null = null;

    const updateBounds = () => {
      if (frame) return;

      frame = requestAnimationFrame(() => {
        setBounds(map.getBounds());
        frame = null;
      });
    };

    updateBounds();

    map.on("move", updateBounds);
    map.on("zoomend", updateBounds);

    return () => {
      map.off("move", updateBounds);
      map.off("zoomend", updateBounds);

      if (frame) cancelAnimationFrame(frame);
    };
  }, [map]);

  return bounds;
}
