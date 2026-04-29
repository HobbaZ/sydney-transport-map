import L from "leaflet";
import normalizeRoute from "./normalizeRoute";

export function createVehicleIcon(
  route: string | null | undefined,
  routeColorMap: Map<string, string>,
) {
  const routeKey = normalizeRoute(route);

  const color = (routeKey && routeColorMap.get(routeKey)) || "#888";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 6px ${color};
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
