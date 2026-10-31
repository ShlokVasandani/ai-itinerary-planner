import type { ProviderId } from "./types";

/**
 * Optional affiliate IDs, read from environment variables.
 *
 *  - Without an ID a provider link goes out plain.
 *  - With an ID the provider's documented tracking parameter is appended.
 *
 * The variables are NEXT_PUBLIC_* because the IDs end up in the outbound URL
 * anyway; they are not secrets. API keys for price lookups (Phase 5) are
 * different: those are server-only and never use this file.
 */
interface AffiliateRule {
  /** Environment variable that holds the ID. */
  env: string;
  /** Query parameters to append when the ID is present. {id} is replaced. */
  params: Record<string, string>;
}

const RULES: Partial<Record<ProviderId, AffiliateRule>> = {
  booking: { env: "NEXT_PUBLIC_AFFILIATE_BOOKING_AID", params: { aid: "{id}" } },
  skyscanner: { env: "NEXT_PUBLIC_AFFILIATE_SKYSCANNER_ID", params: { associateid: "{id}" } },
  viator: {
    env: "NEXT_PUBLIC_AFFILIATE_VIATOR_PID",
    params: { pid: "{id}", mcid: "42383", medium: "link" },
  },
  getyourguide: { env: "NEXT_PUBLIC_AFFILIATE_GETYOURGUIDE_PARTNER_ID", params: { partner_id: "{id}" } },
  klook: { env: "NEXT_PUBLIC_AFFILIATE_KLOOK_AID", params: { aid: "{id}" } },
  "12go": { env: "NEXT_PUBLIC_AFFILIATE_12GO_ID", params: { z: "{id}" } },
};

/** Read lazily so tests (and runtime config) can change process.env. */
function readId(rule: AffiliateRule, env: Record<string, string | undefined>): string | undefined {
  const value = env[rule.env]?.trim();
  return value ? value : undefined;
}

export interface AffiliateResult {
  url: string;
  isAffiliate: boolean;
}

/**
 * Appends the provider's affiliate parameters when an ID is configured.
 * Pass `env` explicitly in tests; defaults to process.env.
 */
export function withAffiliate(
  provider: ProviderId,
  url: string,
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}
): AffiliateResult {
  const rule = RULES[provider];
  if (!rule) return { url, isAffiliate: false };
  const id = readId(rule, env);
  if (!id) return { url, isAffiliate: false };
  try {
    const u = new URL(url);
    for (const [key, template] of Object.entries(rule.params)) {
      u.searchParams.set(key, template.replace("{id}", id));
    }
    return { url: u.toString(), isAffiliate: true };
  } catch {
    return { url, isAffiliate: false };
  }
}

/** Which providers currently have an affiliate ID configured (for disclosure copy). */
export function activeAffiliates(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}
): ProviderId[] {
  return (Object.keys(RULES) as ProviderId[]).filter((p) => !!readId(RULES[p]!, env));
}

/** Environment variable names, for docs and the .env.example generator. */
export const AFFILIATE_ENV_VARS = Object.entries(RULES).map(([provider, rule]) => ({
  provider: provider as ProviderId,
  env: rule!.env,
}));

/** `rel` value for an outbound link. Affiliate links must be marked `sponsored`. */
export function outboundRel(isAffiliate: boolean): string {
  return isAffiliate ? "noopener noreferrer sponsored" : "noopener noreferrer";
}
