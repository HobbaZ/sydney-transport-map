import { Polyline } from "react-leaflet";
import { useEffect, useState } from "react";

type ShapePoint = {
  lat: number;
  lon: number;
};

type RouteShape = {
  routeId: string;
  points: ShapePoint[];
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
      setRoutes(data);
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    const runAnalysis = () => {
      console.log("ROUTES SAMPLE:", Object.values(routes)[0]);

      const allIds = Object.keys(routes);

      const invalid = allIds.filter((id) => {
        const points = routes[id];

        return (
          !Array.isArray(points) ||
          points.length === 0 ||
          !points.every(
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

  const activeRouteIds = new Set(routeColorMap.keys());

  return (
    <>
      {Object.entries(routes).map(([id, shape]) => (
        <Polyline
          key={id}
          positions={shape.points.map((p) => [p.lat, p.lon])}
          pathOptions={{
            color: "red",
            weight: 4,
          }}
        />
      ))}
    </>
  );
}
