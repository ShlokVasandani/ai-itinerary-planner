import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { engineChecks, staticChecks } from "../scripts/open/checks";
import type { Destination } from "../lib/types";
import type { OpenPhoto } from "../scripts/open/photos";

const dir = path.join(process.cwd(), "lib", "data", "open");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !["index.json", "photos.json"].includes(f)) : [];
const photos = JSON.parse(fs.readFileSync(path.join(dir, "photos.json"), "utf8")) as Record<string, OpenPhoto>;

describe("open-data catalog", () => {
  it("index matches the data files", () => {
    const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8")) as { slug: string }[];
    expect(index.map((e) => e.slug).sort()).toEqual(files.map((f) => f.replace(/\.json$/, "")).sort());
  });

  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Destination;
    describe(d.slug, () => {
      it("passes the static checks", () => {
        const errors = staticChecks(d, photos[d.slug]).filter((x) => x.level === "error");
        expect(errors.map((e) => `[${e.check}] ${e.message}`)).toEqual([]);
      });
      it("generates valid itineraries", () => {
        const errors = engineChecks(d).filter((x) => x.level === "error");
        expect(errors.map((e) => e.message)).toEqual([]);
      });
    });
  }
});
