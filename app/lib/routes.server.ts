import simplify from "simplify-js";

let cachedRoutes: Record<string, any> | null = null;
const SHAPES_URL =
  "https://opendata.transport.nsw.gov.au/data/dataset/3e349c1c-9ac0-4f70-8a3f-b1d3e4cb1042/resource/1c2b217e-d0c1-4626-962e-55b73cbbe732/download/sydneytrains.json";

let cachedShapes: any[] | null = null;

function mercatorToLatLng(x: number, y: number) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;

  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);

  return { lat, lon };
}

function simplifyRoute(points: any[]) {
  const formatted = points.map((p) => ({
    x: p.lon,
    y: p.lat,
  }));

  const simplified = simplify(formatted, 0.0005, true);
  // ↑ tolerance tweak:
  // 0.0001 = very detailed
  // 0.0005 = balanced (recommended)
  // 0.001 = aggressive

  return simplified.map((p) => ({
    lat: p.y,
    lon: p.x,
  }));
}

async function loadShapes() {
  if (cachedShapes) return cachedShapes;

  const res = await fetch(SHAPES_URL);
  const data = await res.json();

  cachedShapes = data; // cache in memory

  return data;
}

export async function getRoutes() {
  if (cachedRoutes) {
    return cachedRoutes;
  }

  try {
    const shapes = await loadShapes();

    const routes = {};

    for (const shape of shapes) {
      const shapeId = shape.shape_id;

      if (!shapeId) continue;

      const coords = shape.json_geometry?.coordinates || [];

      const points = [];

      for (let i = 0; i < coords.length; i++) {
        const c = coords[i];
        const lon = mercatorToLatLng(c[0], c[1]);

        if (isNaN(lon.lat) || isNaN(lon.lon)) continue;

        points.push(lon);
      }

      if (points.length < 2) continue;

      routes[shape.route_short_name] = {
        shapeId,
        routeId: shape.route_short_name || null,
        routeName: shape.route_long_name || null,
        color: shape.route_color ? `#${shape.route_color}` : "#888",
        points: simplifyRoute(points),
      };
    }

    cachedRoutes = routes;

    return routes;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to load routes");
  }
}
