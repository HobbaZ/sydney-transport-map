import { Polyline } from "react-leaflet";
import { useEffect, useState } from "react";

type ShapePoint = {
  lat: number;
  lon: number;
};

type RouteShape = {
  routeId: string;
  color: string;
  points: { lat: number; lon: number }[];
};

type Shapes = Record<string, RouteShape>;

export default function RoutesLayer({
  routeColorMap,
}: {
  routeColorMap: Map<string, string>;
}) {
  const [routes, setRoutes] = useState<Shapes>({});

  useEffect(() => {
    const fetchRoutes = async () => {
      const res = await fetch("http://localhost:3001/api/routes");
      const data = await res.json();
      console.log(data);
      setRoutes(data);
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    const runAnalysis = () => {
      const allIds = Object.keys(routes);

      const invalid = allIds.filter((id) => {
        const shape = routes[id];

        return (
          !shape ||
          !Array.isArray(shape.points) ||
          shape.points.length === 0 ||
          !shape.points.every(
            (p) => typeof p.lat === "number" && typeof p.lon === "number",
          )
        );
      });

      console.log("📊 ROUTE SUMMARY:");
      console.log("Total routes:", allIds.length);
      console.log("Valid routes:", allIds.length - invalid.length);
      console.log("Invalid routes:", invalid.length);
      console.log("Broken route IDs:", invalid);
      console.log("SAMPLE ROUTE:", Object.values(routes)[0]);
    };

    runAnalysis();
  }, [routes]);

  return (
    <>
      {Object.entries(routes).map(([id, shape]) => {
        const points = shape.points;

        if (!Array.isArray(points) || points.length < 2) return null;

        return (
          <Polyline
            key={id}
            positions={points.map((p) => [p.lat, p.lon])}
            pathOptions={{
              color: shape.color, // ✅ use backend color
              weight: 4,
              opacity: 0.7,
            }}
          />
        );
      })}
    </>
  );
}
