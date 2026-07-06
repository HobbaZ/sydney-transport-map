import type { Route } from "./+types/home";
import MapClient from "~/components/MapClient";
import { getRoutes } from "~/lib/routes.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sydney Train Tracker" },
    {
      name: "description",
      content: "tracks live trains using realtime data api",
    },
  ];
}

export async function loader() {
  return await getRoutes();
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <MapClient routes={loaderData} />;
}
