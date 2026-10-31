import { describe, expect, it } from "vitest";
import { buildLinks } from "../lib/providers";
import type { OfferKind, SearchQuery } from "../lib/providers";

const HOSTILE = `A B/../"><script>alert(1)</script>?x=1&y=2#frag\\ %00 ` + "‮";

/** Hosts a link may point at, per provider: nothing the traveller types can change where a link goes. */
const HOSTS = [
  "www.google.com", "www.skyscanner.net", "www.booking.com", "www.airbnb.com", "www.viator.com",
  "www.getyourguide.com", "www.klook.com", "12go.asia", "www.rome2rio.com",
];

const kinds: OfferKind[] = ["flight", "stay", "activity", "transfer"];

describe("outbound links built from user input", () => {
  for (const kind of kinds) {
    it(`${kind}: hostile text stays inside the URL's data and never changes its host`, () => {
      const q: SearchQuery = {
        kind,
        city: HOSTILE,
        country: "Thailand", // so 12Go builds a link too
        airportCodes: [],
        currency: "USD",
        origin: HOSTILE,
        from: HOSTILE,
        to: HOSTILE,
        text: HOSTILE,
        startDate: "2027-03-02",
        endDate: "2027-03-05",
        adults: 2,
        children: 1,
      };
      const offers = buildLinks(q);
      for (const o of offers) {
        const u = new URL(o.url);
        expect(u.protocol, o.url).toBe("https:");
        expect(HOSTS, o.url).toContain(u.hostname);
        expect(u.username + u.password, o.url).toBe("");
        // nothing raw that could break out of an attribute or a path segment
        expect(o.url, o.url).not.toMatch(/[<>"\s‮\\]|\.\.\//);
        expect(o.url, o.url).not.toContain("%00%00");
      }
    });
  }

  it("a destination without an airport code is encoded in the Skyscanner path", () => {
    const [o] = buildLinks({ kind: "flight", city: "Bad City/Name", airportCodes: [], origin: "JFK" }).filter((x) => x.provider === "skyscanner");
    expect(o.url).toContain("/transport/flights/jfk/bad%20city%2Fname/");
  });
});
