import { flightQuery } from "@/lib/prices/schema";
import { getFlightPrices } from "@/lib/prices/service";
import { handlePrices } from "@/lib/prices/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keys are read here, on the server, and never sent to the browser.
export function GET(req: Request) {
  return handlePrices(req, flightQuery, (q) => getFlightPrices(q, { TRAVELPAYOUTS_TOKEN: process.env.TRAVELPAYOUTS_TOKEN }));
}
