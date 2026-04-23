require("dotenv").config();

const express = require("express");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const cors = require("cors");

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
    console.log("found vehicles");
    //console.log(vehicles);
    /*console.log(
      "Total entities:",
      feed.entity.length,
      "Valid vehicles:",
      vehicles.length,
    );*/
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

function mercatorToLatLng(x, y) {
  const R = 6378137;

  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);

  return [lat, lon];
}

app.get("/api/routes", async (req, res) => {
  try {
    const shapes = await loadShapes();

    const grouped = {};

    shapes.forEach((shape) => {
      const id = shape.shape_id;
      const routeId = shape.route_short_name; // 🔥 important

      const coords = shape.json_geometry?.coordinates;
      if (!coords || !Array.isArray(coords)) return;

      const points = coords.map(([x, y]) => {
        const [lat, lon] = mercatorToLatLng(x, y);
        return { lat, lon };
      });

      grouped[id] = {
        routeId,
        points,
      };
    });

    res.json(grouped);

    console.log("✅ shapes processed:", Object.keys(grouped).length);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load shapes" });
  }
});

app.listen(3001, () => console.log("Server running on 3001"));
