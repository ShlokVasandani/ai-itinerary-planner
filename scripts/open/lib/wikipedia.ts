import { getJson } from "./http";

interface QueryResult {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: Record<string, { title: string; extract?: string; missing?: string; pageprops?: { disambiguation?: string }; original?: { source: string; width: number; height: number } }>;
  };
}

/** Plain-text intro extracts (CC BY-SA) for a list of English Wikipedia titles. Returns title -> extract. */
export async function extracts(titles: string[], sentences = 2): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < titles.length; i += 20) {
    const chunk = titles.slice(i, i + 20);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=extracts|pageprops&exintro=1&explaintext=1&exsentences=${sentences}&exlimit=20&ppprop=disambiguation` +
      `&titles=${encodeURIComponent(chunk.join("|"))}`;
    const res = await getJson<QueryResult>(url);
    const q = res.query;
    if (!q?.pages) continue;
    const toFinal = (t: string) => {
      const n = q.normalized?.find((x) => x.from === t)?.to ?? t;
      return q.redirects?.find((x) => x.from === n)?.to ?? n;
    };
    const byTitle = new Map(Object.values(q.pages).map((p) => [p.title, p]));
    for (const t of chunk) {
      const p = byTitle.get(toFinal(t));
      if (p && !p.missing && !p.pageprops?.disambiguation && p.extract) out[t] = p.extract.replace(/\s+/g, " ").trim();
    }
  }
  return out;
}

/** Lead image (original file URL) for a Wikipedia page, if it has one. */
export async function pageImageFile(title: string): Promise<string | undefined> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`;
  const res = await getJson<{ query?: { pages?: Record<string, { pageimage?: string }> } }>(url);
  return Object.values(res.query?.pages ?? {})[0]?.pageimage;
}
