require("dotenv").config();

const express = require("express");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.TFNSW_API_KEY;

// Bus vehicle positions feed
const URL = "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/sydneytrains";

app.get("/api/vehicles", async (req, res) => {
  try {
    const response = await fetch(URL, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
    });

    console.log("API KEY:", API_KEY);
    console.log("STATUS:", response.status);
    console.log("CONTENT-TYPE:", response.headers.get("content-type"));

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
    console.log(vehicles);
    console.log(
      "Total entities:",
      feed.entity.length,
      "Valid vehicles:",
      vehicles.length,
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error fetching data",
      details: err.message,
    });
  }
});

app.listen(3001, () => console.log("Server running on 3001"));
