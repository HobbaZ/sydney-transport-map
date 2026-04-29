type Vehicle = {
  id: string;
  lat: number;
  lon: number;
  route?: string | null;
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
