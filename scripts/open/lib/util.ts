export const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const isLatin = (s: string) => /^[\p{Script=Latin}\p{N}\p{P}\p{Z}\p{S}]+$/u.test(s);

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** First one or two sentences of a Wikipedia extract, capped at `max` characters, never cut mid-word. */
export function trimSentences(text: string, max = 300): string {
  // Drop every parenthetical: Wikipedia puts pronunciations, translations and dates there.
  const clean = text
    .replace(/\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  if (lastStop > 80) return cut.slice(0, lastStop + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

export const today = () => new Date().toISOString().slice(0, 10);
