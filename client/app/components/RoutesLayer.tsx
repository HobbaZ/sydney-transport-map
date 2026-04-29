import { Polyline } from "react-leaflet";
import type { Shapes, RouteShape } from "./types";
import normalizeRoute from "./normalizeRoute";

export default function RoutesLayer({
  routes,
  routeColorMap,
}: {
  routes: Shapes;
  routeColorMap: Map<string, string>;
}) {
  return (
    <>
      {Object.entries(routes).map(([id, shape]) => {
        const points = shape.points;

        if (!Array.isArray(points) || points.length < 2) return null;

        return (
          <Polyline
            key={normalizeRoute(id)}
            positions={points.map((p) => [p.lat, p.lon])}
            pathOptions={{
              color: shape.color || routeColorMap.get(id) || "#888",
              weight: 5,
              opacity: 0.9,
            }}
          />
        );
      })}
    </>
  );
}
