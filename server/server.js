require("dotenv").config({
  path: require("path").resolve(__dirname, ".env"),
});

const express = require("express");
const path = require("path");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const cors = require("cors");
const simplify = require("simplify-js");

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.TFNSW_API_KEY;
// Train positions feed
const URL = "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/sydneytrains";

let cachedVehicles = [];
let lastFetchTime = 0;
let lastClientRequest = 0;
const FETCH_INTERVAL = 10000; // 10s
const ACTIVE_WINDOW = 30000; // 30s (consider "user active")
const SHAPES_URL =
  "https://opendata.transport.nsw.gov.au/data/dataset/3e349c1c-9ac0-4f70-8a3f-b1d3e4cb1042/resource/1c2b217e-d0c1-4626-962e-55b73cbbe732/download/sydneytrains.json";

let cachedShapes = null;

function normalizeRoute(id) {
  if (!id) return null;
  // "T8-1", "T8_1", "T8a" → "T8"
  return id.match(/[A-Z0-9]+/)?.[0] ?? null;
}

const app = express();
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://sydtrains-befa51986f3e.herokuapp.com"
        : "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  next();
});

app.get("/api/vehicles", async (req, res) => {
  try {
    const now = Date.now();

    const isActive = now - lastClientRequest < ACTIVE_WINDOW;
    const isStale = now - lastFetchTime > FETCH_INTERVAL;

    // Only fetch if:
    // - someone has been active recently
    // - AND cache is stale
    if (isActive && isStale) {
      await fetchVehiclesFromAPI();
    }

    // update AFTER check
    lastClientRequest = now;

    res.json(cachedVehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error fetching data",
      details: err.message,
    });
  }
});

app.get("/api/routes", async (req, res) => {
  try {
    const shapes = await loadShapes();

    const routes = {};

    for (const shape of shapes) {
      const shapeId = shape.shape_id;

      if (!shapeId) continue;

      const coords = shape.json_geometry?.coordinates || [];

      const points = coords
        .map(([x, y]) => mercatorToLatLng(x, y))
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lon));

      if (points.length < 2) continue;

      routes[shapeId] = {
        shapeId,
        routeId: shape.route_short_name || null,
        routeName: shape.route_long_name || null,
        color: shape.route_color ? `#${shape.route_color}` : "#888",
        points: simplifyRoute(points),
      };
    }

    console.log("Routes built:", Object.keys(routes).length);

    res.json(routes);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to load routes",
    });
  }
});

if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client/build/client");

  app.use(express.static(clientPath));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

async function fetchVehiclesFromAPI() {
  const response = await fetch(URL, {
    headers: {
      Authorization: `apikey ${API_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type");

  const buffer = await response.arrayBuffer();

  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer),
  );

  const vehicles = (feed.entity || [])
    .map((entity) => {
      const v = entity.vehicle;
      if (!v || !v.position) return null;

      // Skip non-passenger or unknown route services
      if (
        !v.trip?.routeId ||
        v.trip?.routeId.startsWith("RTTA") ||
        !v.vehicle?.label
      ) {
        return null;
      }

      return {
        id: entity.id,
        lat: v.position.latitude,
        lon: v.position.longitude,
        routeId: normalizeRoute(v.trip?.routeId),
        routeShort: v.trip?.routeId?.split("_")[0] ?? null,
        tripId: v.trip?.tripId ?? null,
        label: v.vehicle?.label ?? null,
        stopId: v.stopId ?? null,
      };
    })
    .filter(Boolean);

  cachedVehicles = vehicles;

  lastFetchTime = Date.now();
}

async function loadShapes() {
  if (cachedShapes) return cachedShapes;

  const res = await fetch(SHAPES_URL);
  const data = await res.json();

  cachedShapes = data; // cache in memory

  return data;
}

function mercatorToLatLng(x, y) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;

  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);

  return { lat, lon };
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

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
