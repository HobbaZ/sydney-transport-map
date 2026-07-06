import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import dotenv from "dotenv";

dotenv.config();

let cachedVehicles: any[] | null = null;
let lastFetchTime = 0;
let lastClientRequest = 0;
const FETCH_INTERVAL = 10000; // 10s
const ACTIVE_WINDOW = 30000; // 30s (consider "user active")
const API_KEY = process.env.TFNSW_API_KEY;

// Train positions feed
const URL = "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/sydneytrains";

export async function getVehicles() {
  try {
    const now = Date.now();

    const isActive = now - lastClientRequest < ACTIVE_WINDOW;
    const isStale = now - lastFetchTime > FETCH_INTERVAL;

    lastClientRequest = now;

    // Only fetch if:
    // - someone has been active recently
    // - AND cache is stale
    if (!cachedVehicles || (isActive && isStale)) {
      await fetchVehiclesFromAPI();
    }

    return cachedVehicles ?? [];
  } catch (err) {
    console.error(err);
    throw new Error("Error fetching data");
  }
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

  const buffer = await response.arrayBuffer();

  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer),
  );

  const entities = feed.entity || [];
  const vehicles: any[] = [];

  for (const entity of entities) {
    const v = entity.vehicle;
    if (!v?.position) continue;

    const routeId = v.trip?.routeId;
    if (!routeId || routeId.startsWith("RTTA")) continue;

    vehicles.push({
      id: entity.id,
      lat: v.position.latitude,
      lon: v.position.longitude,
      routeshort: routeId.split(/[^A-Z0-9]/)[0],
      routeId,
      label: v.vehicle?.label ?? null,
    });
  }

  if (cachedVehicles) cachedVehicles.length = 0;
  else cachedVehicles = [];

  cachedVehicles.push(...vehicles);

  lastFetchTime = Date.now();
}
