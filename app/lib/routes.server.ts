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

async function loadShapes(): Promise<any[]> {
  if (cachedShapes) return cachedShapes;

  const res = await fetch(SHAPES_URL);
  const body = await res.text();

  console.log("Shapes response:", {
    status: res.status,
    contentType: res.headers.get("content-type"),
  });

  if (!res.ok) {
    throw new Error(`Shapes download failed: ${res.status} ${res.statusText}`);
  }

  let data: unknown;

  try {
    data = JSON.parse(body);
  } catch {
    throw new Error("Shapes download did not return valid JSON");
  }

  if (!Array.isArray(data)) {
    throw new Error("Expected shapes JSON to be an array");
  }

  if (data.length === 0) {
    throw new Error("Shapes JSON contains no routes");
  }

  cachedShapes = data;
  return cachedShapes;
}

export async function getRoutes() {
  if (cachedRoutes) {
    return cachedRoutes;
  }

  try {
    const shapes = await loadShapes();

    console.log("Shape count:", shapes.length);
    console.log("First shape keys:", Object.keys(shapes[0] ?? {}));
    console.log(
      "First shape preview:",
      JSON.stringify(shapes[0], null, 2).slice(0, 2000),
    );

    const routes: Record<string, any> = {};

    for (const shape of shapes) {
      const shapeId = shape.ROUTE_ID;
      if (!shapeId) continue;

      const coords = shape.json_geometry?.coordinates || [];
      const points = [];

      for (const c of coords) {
        const { lat, lon } = mercatorToLatLng(c[0], c[1]);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        points.push({ lat, lon });
      }

      if (points.length < 2) continue;

      const routeShortName = shape.ROUTE_SHORT_NAME;

      routes[routeShortName] = {
        shapeId,
        routeId: routeShortName || null,
        routeName: shape.ROUTE_LONG_NAME || null,
        color: shape.ROUTE_COLOR ? `#${shape.ROUTE_COLOR}` : "#888",
        points: simplifyRoute(points),
      };
    }

    if (Object.keys(routes).length === 0) {
      throw new Error("No valid route geometry found in route data");
    }

    cachedRoutes = routes;

    return routes;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to load routes");
  }
}
