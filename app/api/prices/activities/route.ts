import { activityQuery } from "@/lib/prices/schema";
import { getActivityPrices } from "@/lib/prices/service";
import { handlePrices } from "@/lib/prices/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handlePrices(req, activityQuery, (q) => getActivityPrices(q, { VIATOR_API_KEY: process.env.VIATOR_API_KEY }));
}
