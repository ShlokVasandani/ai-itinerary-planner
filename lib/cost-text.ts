// Parses free-text price strings ("€15", "€35–55", "THB 60–200", "S$368+") into numbers.
// Shared by scripts/parse-costs.ts and the itinerary engine (budget tiers).

export interface ParsedCost {
  min?: number;
  max?: number;
  currency?: string;
  note?: string; // set when the result needs review
}

const SYMBOLS: [RegExp, string][] = [
  [/US\$/, "USD"],
  [/NT\$|TWD/, "TWD"],
  [/R\$|BRL/, "BRL"],
  [/C\$|CAD/, "CAD"],
  [/NZ\$|NZD/, "NZD"],
  [/₹|INR/, "INR"],
  [/₫|VND/, "VND"],
  [/CZK/, "CZK"],
  [/PLN/, "PLN"],
  [/HUF/, "HUF"],
  [/SEK/, "SEK"],
  [/NOK/, "NOK"],
  [/MXN/, "MXN"],
  [/ARS/, "ARS"],
  [/ZAR/, "ZAR"],
  [/EGP/, "EGP"],
  [/MAD/, "MAD"],
  [/HK\$/, "HKD"],
  [/S\$/, "SGD"],
  [/A\$|AUD/, "AUD"],
  [/€|EUR/, "EUR"],
  [/£|GBP/, "GBP"],
  [/₩|KRW/, "KRW"],
  [/₺|TRY/, "TRY"],
  [/¥|JPY/, "JPY"],
  [/THB/, "THB"],
  [/RM|MYR/, "MYR"],
  [/AED/, "AED"],
  [/DKK/, "DKK"],
  [/CHF/, "CHF"],
  [/SGD/, "SGD"],
  [/\$|USD/, "$"], // resolved against the city currency
];

const MONEY =
  /(HK\$|S\$|A\$|US\$|NT\$|R\$|C\$|NZ\$|€|£|¥|₩|₺|₹|₫|\$|THB|RM|AED|DKK|CHF|AUD|SGD|USD|EUR|GBP|JPY|KRW|TRY|MYR|TWD|BRL|CAD|NZD|INR|VND|CZK|PLN|HUF|SEK|NOK|MXN|ARS|ZAR|EGP|MAD)\s?(\d[\d,]*(?:\.\d+)?)(?:\s?[–-]\s?(\d[\d,]*(?:\.\d+)?))?(\+)?/g;

function num(s: string): number {
  return Number(s.replace(/,/g, ""));
}

function currencyOf(symbol: string, cityCurrency: string): { code: string; guessed: boolean } {
  for (const [re, code] of SYMBOLS) {
    if (re.test(symbol)) {
      if (code === "$") return { code: ["USD", "AUD", "SGD", "HKD", "CAD", "NZD", "MXN", "ARS", "TWD"].includes(cityCurrency) ? cityCurrency : "USD", guessed: true };
      return { code, guessed: false };
    }
  }
  return { code: cityCurrency, guessed: true };
}

export function parseCost(textRaw: string, cityCurrency: string): ParsedCost {
  const text = textRaw.replace(/~/g, "").trim();
  const matches = [...text.matchAll(MONEY)];
  const startsFree = /^free\b/i.test(text);

  if (matches.length === 0) {
    if (startsFree) return { min: 0, max: 0, currency: cityCurrency };
    return { note: "no numeric amount in text" };
  }

  const first = matches[0];
  const { code, guessed } = currencyOf(first[1], cityCurrency);
  const notes: string[] = [];
  // Every amount mentioned, as [min, max|undefined(open-ended)].
  const amounts = matches.map((m) => {
    const lo = num(m[2]);
    const hi = m[3] ? num(m[3]) : lo;
    return { lo, hi, open: Boolean(m[4]) };
  });
  let min = Math.min(...amounts.map((a) => a.lo));
  let max: number | undefined = Math.max(...amounts.map((a) => a.hi));

  if (startsFree) {
    // "Free; tower climb ~€6": entry is free, an optional extra costs money.
    notes.push(`free entry with optional paid extra (${matches.map((m) => m[0]).join(", ")}); costMax is the extra`);
    min = 0;
  } else if (matches.length > 1) {
    notes.push(`several amounts (${matches.map((m) => m[0]).join(", ")}); used the full span`);
  }
  if (amounts.some((a) => a.open) && !startsFree && matches.length === 1 && !first[3]) {
    max = undefined;
    notes.push("open-ended '+' amount; costMax left undefined");
  } else if (amounts.some((a) => a.open)) {
    notes.push("top of the range is open-ended ('+'); costMax is the stated figure");
  }
  if (guessed && code !== cityCurrency) notes.push(`'$' assumed to be ${code}`);
  if (code !== cityCurrency) notes.push(`currency ${code} differs from the city's ${cityCurrency}`);

  return { min, max, currency: code, note: notes.length ? notes.join("; ") : undefined };
}

