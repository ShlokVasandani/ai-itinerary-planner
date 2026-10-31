import { describe, expect, it } from "vitest";
import { destinations } from "../lib/data";
import { outboundRel, withAffiliate } from "../lib/providers/affiliateConfig";
import { searchLinks } from "../lib/providers/links";
import { officialOffer, tripLinks } from "../lib/providers";

const paris = destinations.find((d) => d.slug === "paris")!;
const bangkok = destinations.find((d) => d.slug === "bangkok")!;

describe("link adapters", () => {
  const q = {
    kind: "flight" as const,
    city: "Paris",
    country: "France",
    airportCodes: ["CDG", "ORY"],
    origin: "JFK",
    startDate: "2027-05-01",
    endDate: "2027-05-08",
    adults: 2,
    children: 1,
  };

  it("builds flight links from airports, dates and travellers", async () => {
    const offers = await searchLinks(q);
    const sky = offers.find((o) => o.provider === "skyscanner")!;
    expect(sky.url).toContain("/transport/flights/jfk/cdg/270501/270508/");
    expect(sky.url).toContain("adultsv2=2");
    const g = offers.find((o) => o.provider === "google-flights")!;
    expect(decodeURIComponent(g.url)).toContain("Flights to CDG from JFK on 2027-05-01 through 2027-05-08");
    expect(offers.every((o) => o.isSample === false && o.price === undefined)).toBe(true);
  });

  it("builds stay links with check-in, check-out and guests", async () => {
    const offers = await searchLinks({ ...q, kind: "stay" });
    const b = offers.find((o) => o.provider === "booking")!;
    const u = new URL(b.url);
    expect(u.searchParams.get("checkin")).toBe("2027-05-01");
    expect(u.searchParams.get("checkout")).toBe("2027-05-08");
    expect(u.searchParams.get("group_adults")).toBe("2");
    expect(u.searchParams.get("group_children")).toBe("1");
    expect(offers.some((o) => o.provider === "airbnb")).toBe(true);
  });

  it("builds activity links for the three marketplaces", async () => {
    const offers = await searchLinks({ ...q, kind: "activity", text: "Seine river cruise" });
    expect(offers.map((o) => o.provider).sort()).toEqual(["getyourguide", "klook", "viator"]);
    for (const o of offers) expect(decodeURIComponent(o.url)).toContain("Seine river cruise Paris");
  });

  it("only offers 12Go in the regions it covers", async () => {
    const t = { kind: "transfer" as const, city: "Bangkok", country: "Thailand", from: "Bangkok", to: "Ayutthaya" };
    expect((await searchLinks(t)).some((o) => o.provider === "12go")).toBe(true);
    expect((await searchLinks({ ...t, city: "Paris", country: "France" })).some((o) => o.provider === "12go")).toBe(false);
    expect((await searchLinks(t)).some((o) => o.provider === "rome2rio")).toBe(true);
  });

  it("builds a trip panel", async () => {
    const links = await tripLinks({ destination: paris, startDate: "2027-05-01", endDate: "2027-05-04", adults: 2 }, ["Louvre"]);
    expect(links.flights.length).toBeGreaterThan(0);
    expect(links.stays.length).toBeGreaterThan(0);
    expect(links.activities.length).toBeGreaterThan(3);
    expect(links.transfers.some((o) => o.provider === "rome2rio")).toBe(true);
    const t = await tripLinks({ destination: bangkok }, []);
    expect(t.transfers.some((o) => o.provider === "12go")).toBe(true);
  });
});

describe("affiliate config", () => {
  it("leaves links plain without IDs", () => {
    const r = withAffiliate("booking", "https://www.booking.com/searchresults.html?ss=Paris", {});
    expect(r).toEqual({ url: "https://www.booking.com/searchresults.html?ss=Paris", isAffiliate: false });
  });

  it("appends the provider parameter with an ID", () => {
    const r = withAffiliate("booking", "https://www.booking.com/searchresults.html?ss=Paris", {
      NEXT_PUBLIC_AFFILIATE_BOOKING_AID: "12345",
    });
    expect(r.isAffiliate).toBe(true);
    expect(new URL(r.url).searchParams.get("aid")).toBe("12345");
    expect(new URL(r.url).searchParams.get("ss")).toBe("Paris");
  });

  it("never touches providers without a program", () => {
    const r = withAffiliate("google-flights", "https://www.google.com/travel/flights?q=x", { NEXT_PUBLIC_AFFILIATE_BOOKING_AID: "1" });
    expect(r.isAffiliate).toBe(false);
  });

  it("marks affiliate links as sponsored", () => {
    expect(outboundRel(true)).toBe("noopener noreferrer sponsored");
    expect(outboundRel(false)).toBe("noopener noreferrer");
  });
});

describe("official offers", () => {
  it("prefers a booking URL, then the official URL", () => {
    expect(officialOffer({ name: "x", bookingUrl: "https://a.example/book", officialUrl: "https://a.example" })?.title).toBe("Book official");
    expect(officialOffer({ name: "x", officialUrl: "https://a.example" })?.title).toBe("Official site");
    expect(officialOffer({ name: "x" })).toBeUndefined();
  });
});
