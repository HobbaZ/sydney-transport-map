export default function normalizeRoute(id?: string | null) {
  if (!id) return null;

  const match = id.match(/[A-Z0-9]+/g);
  return match?.[0] ?? null;
}
