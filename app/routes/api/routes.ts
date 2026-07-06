import { data } from "react-router";
import { getRoutes } from "../../lib/routes.server";

export async function loader() {
  return data(await getRoutes());
}
