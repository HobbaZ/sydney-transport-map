import { Polyline } from "react-leaflet";
import type { Shapes } from "./types";

export default function RoutesLayer({ routes }: { routes: Shapes }) {
  return (
    <>
      {Object.entries(routes).map(([id, shape]) => {
        if (!Array.isArray(shape.points) || shape.points.length < 2) {
          return null;
        }

        const latLngs = shape.points.map(
          (p) => [p.lat, p.lon] as [number, number],
        );

        return (
          <Polyline
            key={id}
            positions={latLngs}
            pathOptions={{
              color: shape.color || "#888",
              weight: 5,
              opacity: 0.9,
            }}
          />
        );
      })}
    </>
  );
}
