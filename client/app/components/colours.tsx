export function getRouteColor(route?: string | null) {
  if (!route) return "#666";

  const key = route.toUpperCase();

  if (key.includes("T1")) return "#f99d1c";
  if (key.includes("T2")) return "#0098cd";
  if (key.includes("T3")) return "#f37021";
  if (key.includes("T4")) return "#005aa3";
  if (key.includes("T8")) return "#00954c";

  return "#0078ff";
}
