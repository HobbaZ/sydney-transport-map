import L from "leaflet";
import { lineColours } from "./lineColours";

export function createVehicleIcon(routeId: string | null | undefined) {
  const routeKey = normalizeRoute(routeId);

  const colourMap = Object.fromEntries(
    lineColours.map((line) => [line.id, line.color]),
  );

  const color = colourMap[routeKey] || "#888";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background: ${color};
        border-radius: 50%;
        border: 1px solid white;
        box-shadow: 0 0 6px ${color};
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function normalizeRoute(route?: string | null) {
  if (!route) return null;

  return route.split("_")[0];
}
