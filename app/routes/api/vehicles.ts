import { data } from "react-router";
import { getVehicles } from "../../lib/vehicles.server";

export async function loader() {
  return data(await getVehicles());
}
