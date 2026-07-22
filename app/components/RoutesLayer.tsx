import { Polyline } from "react-leaflet";
import type { Shapes, RouteShape } from "./types";

export default function RoutesLayer({ routes }: { routes: Shapes }) {
  return (
    <>
      {(Object.entries(routes) as [string, RouteShape][]).map(([id, shape]) => {
        if (shape.points.length < 2) {
          return null;
        }

        return (
          <Polyline
            key={id}
            positions={shape.points.map((p) => [p.lat, p.lon])}
            pathOptions={{
              color: shape.color,
              weight: 5,
              opacity: 0.9,
            }}
          />
        );
      })}
    </>
  );
}
