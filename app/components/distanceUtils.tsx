function getClosestPointOnSegment(p, a, b) {
  const atob = { lat: b.lat - a.lat, lon: b.lon - a.lon };
  const atop = { lat: p.lat - a.lat, lon: p.lon - a.lon };

  const len = atob.lat * atob.lat + atob.lon * atob.lon;
  const dot = atop.lat * atob.lat + atop.lon * atob.lon;

  const t = Math.max(0, Math.min(1, dot / len));

  return {
    lat: a.lat + atob.lat * t,
    lon: a.lon + atob.lon * t,
    t,
  };
}

export function snapToRoute(point, routePoints) {
  let closest = null;
  let minDist = Infinity;
  let totalDist = 0;
  let bestDistAlong = 0;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];

    const segLength = Math.hypot(b.lat - a.lat, b.lon - a.lon);

    const p = getClosestPointOnSegment(point, a, b);

    const dist = Math.hypot(point.lat - p.lat, point.lon - p.lon);

    if (dist < minDist) {
      minDist = dist;
      closest = p;
      bestDistAlong = totalDist + segLength * p.t;
    }

    totalDist += segLength;
  }

  return {
    ...closest,
    distAlong: bestDistAlong,
    totalLength: totalDist,
    distance: minDist,
  };
}

export function getPointAtDistance(routePoints, targetDist: number) {
  let travelled = 0;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];

    const segLength = Math.hypot(b.lat - a.lat, b.lon - a.lon);

    if (travelled + segLength >= targetDist) {
      const t = (targetDist - travelled) / segLength;

      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lon: a.lon + (b.lon - a.lon) * t,
      };
    }

    travelled += segLength;
  }

  return routePoints[routePoints.length - 1];
}
