import { useEffect, useState } from "react";

export default function MapClient() {
  const [Map, setMap] = useState(null);

  useEffect(() => {
    import("./Map").then((mod) => {
      setMap(() => mod.default);
    });
  }, []);

  if (!Map) return <div>Loading map...</div>;

  return <Map />;
}
