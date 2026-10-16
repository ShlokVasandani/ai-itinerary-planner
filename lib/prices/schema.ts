import { z } from "zod";

const iata = z.string().trim().regex(/^[A-Za-z]{3}$/, "Use a 3-letter airport code").transform((s) => s.toUpperCase());
const currency = z.string().trim().regex(/^[A-Za-z]{3}$/).transform((s) => s.toUpperCase());
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const flightQuery = z.object({
  origin: iata,
  destination: iata,
  departure: isoDate.optional(),
  return: isoDate.optional(),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  currency: currency.default("USD"),
});
export type FlightQuery = z.infer<typeof flightQuery>;

export const activityQuery = z.object({
  q: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(60),
  currency: currency.default("USD"),
});
export type ActivityQuery = z.infer<typeof activityQuery>;
