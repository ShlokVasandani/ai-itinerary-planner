import { getJson } from "./http";

export interface CommonsInfo {
  filename: string;
  width: number;
  height: number;
  license: string;
  artist: string;
  sourcePage: string;
  description: string;
}

const strip = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Licenses we accept for redistribution with attribution. NC / ND variants are rejected. */
export const OK_LICENSE = /^(CC0|Public domain|PD|CC BY(?!-N)(-SA)? \d(\.\d)?)/i;

export async function commonsInfo(filename: string): Promise<CommonsInfo | undefined> {
  const title = `File:${filename.replace(/_/g, " ")}`;
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata|size|mime` +
    `&iiextmetadatafilter=LicenseShortName|Artist|ImageDescription&titles=${encodeURIComponent(title)}`;
  const res = await getJson<{ query?: { pages?: Record<string, { imageinfo?: { width: number; height: number; mime: string; extmetadata?: Record<string, { value: string }> }[] }> } }>(url);
  const info = Object.values(res.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info || !/^image\/(jpeg|png|webp)$/.test(info.mime)) return undefined;
  const m = info.extmetadata ?? {};
  return {
    filename: filename.replace(/_/g, " "),
    width: info.width,
    height: info.height,
    license: strip(m.LicenseShortName?.value ?? ""),
    artist: strip(m.Artist?.value ?? "").slice(0, 120) || "Wikimedia Commons contributor",
    sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    description: strip(m.ImageDescription?.value ?? "").slice(0, 160),
  };
}
