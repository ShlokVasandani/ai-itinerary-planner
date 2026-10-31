import { NextResponse } from "next/server";
import type { z, ZodTypeAny } from "zod";
import { RateLimiter, clientKey } from "./ratelimit";

const limiter = new RateLimiter(20, 60_000);

/** Shared guard for the price routes: rate limit, validate query params with zod, never leak details. */
export async function handlePrices<S extends ZodTypeAny>(
  req: Request,
  schema: S,
  run: (q: z.output<S>) => Promise<unknown>,
  limit = limiter
): Promise<NextResponse> {
  const rl = limit.check(clientKey(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  try {
    const body = await run(parsed.data);
    return NextResponse.json(body, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    return NextResponse.json({ error: "Price lookup failed" }, { status: 502 });
  }
}
