type Vehicle = {
  id: string;
  lat: number;
  lon: number;
  routeId?: string | null;
  tripId: string | null;
  label: string | null;
  stopId: string | null;
  timestamp?: number | null;
};

type AnimatedVehicle = Vehicle & {
  prevLat: number;
  prevLon: number;
  distAlong: number;
  prevDistAlong: number;
  speed: number;
};

type RouteShape = {
  routeId: string;
  color: string;
  points: { lat: number; lon: number }[];
};

type Shapes = Record<string, RouteShape>;

type VehicleMap = Record<string, AnimatedVehicle>;
