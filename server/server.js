require("dotenv").config();

const express = require("express");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const cors = require("cors");
const simplify = require("simplify-js");

const app = express();
app.use(cors());

const API_KEY = process.env.TFNSW_API_KEY;

// Train positions feed
const URL = "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/sydneytrains";

app.get("/api/vehicles", async (req, res) => {
  try {
    const response = await fetch(URL, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
    });

    console.log("STATUS:", response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const buffer = await response.arrayBuffer();

    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer),
    );

    const vehicles = (feed.entity || [])
      .map((entity) => {
        const v = entity.vehicle;

        if (!v || !v.position) return null;

        return {
          id: entity.id,
          lat: v.position.latitude,
          lon: v.position.longitude,
          route: v.trip?.routeId ?? null,
        };
      })
      .filter(Boolean);

    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error fetching data",
      details: err.message,
    });
  }
});

const SHAPES_URL =
  "https://opendata.transport.nsw.gov.au/data/dataset/3e349c1c-9ac0-4f70-8a3f-b1d3e4cb1042/resource/1c2b217e-d0c1-4626-962e-55b73cbbe732/download/sydneytrains.json";

let cachedShapes = null;

async function loadShapes() {
  if (cachedShapes) return cachedShapes;

  const res = await fetch(SHAPES_URL);
  const data = await res.json();

  cachedShapes = data; // cache in memory

  return data;
}

function simplifyRoute(points) {
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

function mercatorToLatLng(x, y) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;

  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);

  return { lat, lon };
}

function mergePoints(existing, incoming) {
  if (existing.length === 0) return incoming;

  const last = existing[existing.length - 1];
  const first = incoming[0];

  const dist = Math.hypot(last.lat - first.lat, last.lon - first.lon);

  // if close → append
  if (dist < 0.01) {
    return [...existing, ...incoming];
  }

  // otherwise keep separate (avoid bad joins)
  return existing;
}

const seenShapes = new Set();

app.get("/api/routes", async (req, res) => {
  try {
    const shapes = await loadShapes();

    const routes = {};
    const processedShapeIds = new Set();

    shapes.forEach((shape) => {
      // ✅ prevent duplicate shapes
      if (processedShapeIds.has(shape.shape_id)) return;
      processedShapeIds.add(shape.shape_id);

      const routeId = shape.route_short_name; // "T8"
      const color = `#${shape.route_color}`;

      const coords = shape.json_geometry?.coordinates || [];

      const points = coords
        .map(([x, y]) => mercatorToLatLng(x, y))
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lon));

      if (points.length < 2) return;

      points.sort((a, b) => a.lat - b.lat || a.lon - b.lon);

      if (!routes[routeId]) {
        routes[routeId] = {
          routeId,
          color,
          points: [],
        };
      }

      // ✅ merge + simplify ONCE per append
      const merged = mergePoints(routes[routeId].points, points);
      routes[routeId].points = simplifyRoute(merged);
    });

    console.log("Routes built:", Object.keys(routes).length);

    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load routes" });
  }
});
app.listen(3001, () => console.log("Server running on 3001"));
