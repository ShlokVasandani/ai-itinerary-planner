import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cityIndex } from "../lib/data/catalog";
import { getPhoto, getPhotoCredit } from "../lib/photos";

const dir = path.join(__dirname, "..", "public", "images", "destinations");

describe("photo credits", () => {
  it("every city that shows a photo has an author, a licence and a Wikimedia Commons source page", () => {
    const missing: string[] = [];
    for (const c of cityIndex) {
      if (!getPhoto(c.slug)) continue;
      const credit = getPhotoCredit(c.slug);
      if (!credit?.credit?.trim() || !credit.license?.trim() || !credit.alt?.trim()) missing.push(`${c.slug}: incomplete credit`);
      else if (!/^https:\/\/commons\.wikimedia\.org\//.test(credit.sourcePage)) missing.push(`${c.slug}: source page ${credit.sourcePage}`);
      else if (!/^(CC |Public domain|CC0|PD)/i.test(credit.license)) missing.push(`${c.slug}: unrecognised licence "${credit.license}"`);
    }
    expect(missing).toEqual([]);
  });

  it("every photo file on disk belongs to a credited city, and every credited city has its files", () => {
    const files = readdirSync(dir).filter((f) => f !== ".gitkeep");
    const strays = files.filter((f) => {
      const slug = f.replace(/(-\d+)?\.(avif|webp|jpg)$/, "");
      return !getPhoto(slug) || !getPhotoCredit(slug);
    });
    expect(strays, "files with no manifest entry or credit").toEqual([]);
    for (const c of cityIndex.filter((c) => getPhoto(c.slug))) {
      const slug = c.slug;
      expect(files, slug).toContain(`${slug}.jpg`);
      for (const w of getPhoto(slug)!.widths) {
        expect(files, `${slug} ${w}`).toContain(`${slug}-${w}.avif`);
        expect(files, `${slug} ${w}`).toContain(`${slug}-${w}.webp`);
      }
    }
  });

  it("only image files are in the photos folder (no archives)", () => {
    for (const f of readdirSync(dir).filter((f) => f !== ".gitkeep")) {
      expect(f, f).toMatch(/\.(avif|webp|jpg)$/);
      expect(statSync(path.join(dir, f)).size, f).toBeLessThan(2 * 1024 * 1024);
    }
  });
});
