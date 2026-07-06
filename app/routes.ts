import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  route("api/routes", "routes/api/routes.ts"),
  route("api/vehicles", "routes/api/vehicles.ts"),
] satisfies RouteConfig;
