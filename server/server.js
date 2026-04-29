require("dotenv").config();

const express = require("express");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const cors = require("cors");
const simplify = require("simplify-js");

const app = express();
app.use(cors());

const API_KEY = process.env.TFNSW_API_KEY;

function normalizeRoute(id) {
  if (!id) return null;

  // examples:
  // "T8-1", "T8_1", "T8a" → "T8"
  return id.match(/[A-Z0-9]+/)?.[0] ?? null;
}

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
          route: normalizeRoute(v.trip?.routeId),
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

  const simplified = simplify(formatted, 0.0001, true);
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

app.get("/api/routes", async (req, res) => {
  try {
    const shapes = await loadShapes();

    const grouped = {};

    for (const shape of shapes) {
      const routeId = shape.route_short_name;
      const shapeId = shape.shape_id;

      const coords = shape.json_geometry?.coordinates || [];

      const points = coords
        .map(([x, y]) => mercatorToLatLng(x, y))
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lon));

      if (points.length < 2) continue;

      if (!grouped[routeId]) {
        grouped[routeId] = {
          shapes: {},
          color: shape.route_color ? `#${shape.route_color}` : "#888",
        };
      }

      grouped[routeId].shapes[shapeId] = points;
    }

    const routes = {};

    for (const [routeId, data] of Object.entries(grouped)) {
      const shapesMap = data.shapes;
      const color = data.color;

      // Get first shape
      const firstShape = Object.values(shapesMap)[0];

      routes[routeId] = {
        routeId,
        color,
        points: simplifyRoute(firstShape),
      };
    }

    console.log("Routes built:", Object.keys(routes).length);

    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load routes" });
  }
});

app.listen(3001, () => console.log("Server running on 3001"));
