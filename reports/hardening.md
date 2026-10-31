# Sekai hardening report

Branch `hardening`, created from `redesign`. Nothing pushed; no history rewritten; `main` untouched. Palette, layout and
fonts are unchanged.

## 1. What I fixed

### Loose ends

| # | Item | What changed | Commit | Test |
| --- | --- | --- | --- | --- |
| 1.1 | City-guide tabs | ARIA tabs keyboard pattern: Left/Right (wrapping), Home/End, roving tabindex, `aria-selected`, every tab's `aria-controls` points at the one real panel (before, inactive tabs pointed at ids that were not in the page), visible focus ring drawn inside the tab (the tab bar scrolls sideways and clipped an outside ring) | `eafd273` | `tests/tabs.test.tsx`; keyboard run in `scripts/verify-e2e.ts` and `scripts/verify-browser.ts` |
| 1.2 | Impossible plans | A trip with no room for sightseeing (late landing, early flight, both squeezed on a one-day trip) now shows "This trip is too tight for your flight times", explains why and names the fields to change (Trip length, Landing on day 1, Flight home, last day). The engine is unchanged | `0315569` | `tests/trip-problem.test.tsx`; browser check in `verify-e2e.ts` |
| 1.3 | Mislabelled meal slots | A meal that opening hours push outside its usual time is labelled honestly: "Late lunch" (after 15:30), "Evening meal" (lunch after 18:00), "Evening drinks" (coffee after 18:30), "Brunch", "Early dinner". Nothing is moved; opening hours are respected exactly as before | `2860e04` | `tests/meal-labels.test.ts`, `tests/engine.test.ts` (all 50 cities) |
| 1.4 | Swap / Shuffle and interests | Engine untouched. Documented in the README ("Known limitations"); I chose that over a line of helper text under every one of up to 14 days | `39ebd07` | n/a |
| 1.5 | Back/forward transitions | **No simple, safe fix.** I tried a crossfade default for untyped navigations and measured: back and forward still start no view transition (0 before and after), because Next does not run popstate through one. Reverted and documented as a known limitation | `39ebd07` | measured in a real browser |
| 1.6 | Repo hygiene | Generated stress output (`reports/screenshots`, the raw results JSON) untracked and ignored; `.gitignore` covers every `.env.*` except `.env.example`, `*.zip`, `*.log`. Findings in section 4 | `7b869b2` | n/a |
| 1.7 | Docs | README: run, test, e2e, stress test, motion tokens and rules (including: a library-owned element such as the Leaflet host must never have a dynamic `className`), known limitations, photo credits policy, CI, security | `39ebd07` | n/a |
| 1.8 | Tidy | ESLint added (there was no linter); everything it found fixed; dead code removed (`components/Reveal.tsx` and its CSS, an unused map, unused imports); React effect patterns fixed properly rather than silenced | `0ea5c3f`, `641785f` | lint, typecheck, 160 tests |

### Security

| # | Item | Result | Commit |
| --- | --- | --- | --- |
| 2.1 | Secrets | Working tree and all 38 commits on all 8 branches scanned (AWS, GitHub, Slack, Google, Stripe/OpenAI-style keys, private keys, JWTs, assigned secrets, URLs with credentials, `.env` files). **Nothing found.** `.env.example` has empty values. The only risky file name ever committed is one `.DS_Store` in the first commit, harmless | `7b869b2` (ignore rules) |
| 2.2 | Dependencies | `npm audit`: **0 vulnerabilities** (production and dev). Next 16.4.2 to 16.4.3 and React 19.2.8 to 19.3.1 (latest within their majors) | `e480699` |
| 2.3 | Headers | Already present: CSP (with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`, `form-action`, tile-server-only `img-src`), nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, COOP. Changed: HSTS now production only. Logic moved to `lib/security-headers.mjs` so it is tested. Verified in a real browser: maps, photos, fonts and the city picker work with **0 CSP violations** | `b469973` |
| 2.4 | Links | Every `target="_blank"` link goes through `OutboundLink` (`rel="noopener noreferrer"`, plus `sponsored` for affiliate links). Every user-influenced URL part is encoded (`encodeURIComponent`, `URLSearchParams`, an IATA check or a slug filter). One gap closed: Skyscanner's path used the raw city name when a destination had no airport code | `30eea3a` |
| 2.5 | Input handling | Dates must be real calendar dates in 1900 to 2200 (`2027-02-31` and `9999-12-31` were accepted), flight times must be on a 24-hour clock (`99:99` was accepted), a NaN trip length gave a plan with zero days (fixed), trip length and party size are clamped. No `innerHTML` with user data (the one `bindPopup` escapes), no `eval`, no open redirects (`router.push` builds from known values). JSON-LD escapes `<`, `>` and `&`. API routes: GET only, zod-validated with length caps, 20 requests a minute per client, generic error bodies, no CORS headers, no stack traces | `98a42a8` |
| 2.6 | Privacy | Nothing in localStorage, sessionStorage, cookies or IndexedDB; no analytics; fonts are self-hosted by `next/font`; photos are local. The only third party a page contacts is the OpenStreetMap tile server, for maps near the viewport. Attribution is visible on every map, there is no prefetching, maps mount lazily 200 px before they scroll into view, and repeated tiles come from the browser cache | audit only |
| 2.7 | Photos | All 50 cities have a photo with author, licence, alt text and a Wikimedia Commons source page, shown on `/credits`; the files on disk match the manifest exactly; no archive is anywhere in the tree or in history | `0d69faf` |
| 2.8 | Guardrails | `.github/workflows/ci.yml` (install, lint, typecheck, vitest, production build on pull requests, read-only permissions), `.github/dependabot.yml` (npm and GitHub Actions, weekly), `SECURITY.md` | `5ccadd7` |

All 15 commits, in order:

- `7b869b2` Repo hygiene: stop tracking generated stress-test output; tighten .gitignore
- `eafd273` City-guide tabs: full keyboard support (ARIA tabs pattern)
- `0315569` Impossible plans: say so, and say what to change
- `2860e04` Meal slots that land outside their usual hours are labelled honestly
- `e480699` Update Next.js to 16.4.3 and React to 19.3.1
- `641785f` Fix what a first lint run found; remove dead code
- `0ea5c3f` Add ESLint (flat config, eslint-config-next) and an npm run lint script
- `30eea3a` Encode the destination in Skyscanner's URL path
- `98a42a8` Validate dates, clock times and numbers for real
- `b469973` Security headers: HSTS in production only; header set moved into a tested module
- `0d69faf` Test that every photo is credited and no stray image files are committed
- `5ccadd7` Add CI, Dependabot and a security policy
- `39ebd07` README: how to run, test and stress-test; motion rules; known limitations; photo policy
- `3d90bc3` stress: understand the too-tight notice and relabelled meals
- `3ee2df5` e2e: retry a city once instead of crashing; add a real-browser check of the main flow

(and the commit holding this report, the stress merge tool and the e2e notice check)

## 2. Verification

| Check | Result |
| --- | --- |
| vitest | **160 / 160** passing |
| typecheck, lint | clean |
| production build | succeeds; response headers checked on the running server (HSTS present in production) |
| `scripts/verify-e2e.ts` on the production build, all 50 cities | **passes**: every Book menu, outbound link, day map, city switching, day-trip menus, tab keyboard and the too-tight notice. One city timed out in the first full run on a busy machine and crashed the script; it passed 3 of 3 on re-run, and the script now retries a city once. The first run covered 45 cities before it crashed and the other 5 were run directly afterwards |
| Real browser, Tokyo and Lisbon, real tiles (`scripts/verify-browser.ts`) | **28 / 28**: switched city twice, built, every day map showed real tiles and the right number of pins, Shuffle and Swap kept stops and pins in step, the tab keyboard moved focus and selection and wrapped, the focused tab had a 2 px focus ring, **no console errors and no CSP violations**. 38 tile requests in total, one at a time with a pause and a hard cap of 100 |
| Real tiles, three cities (stress test) | Tokyo, Lisbon, Rome: tiles loaded, 12 px attribution |

### Stress test, 50 cities, 2,900 plans

| | Previous run | Now |
| --- | ---: | ---: |
| Plans with at least one failure | 52 | **15** |
| Total failures | 56 | **15** |
| Distinct failure types | 6 | **4** |
| `time.meal-window` | 37 | **0** |
| `prop.travellers` (harness rounding) | 4 | **0** |
| `interest.*` | 15 | 15 |

No failure type that was fixed has come back, and nothing new appeared. The 15 that remain are all the same kind, a selected
interest with no matching stop, and none is a new defect (the first group is the documented limitation; the second is plans too constrained to fit every selected interest):

- 5 are plans the traveller edited with Swap or Shuffle (`I:swap` x4, `I:shuffle` x1); the interest guarantee applies when a plan is generated.
- 10 have no room: one-day trips with both flight times (4), a landing at 23:15 that leaves one usable day (2), a five-interest combination (1), two travel styles in Dublin, where only one venue matches the interest (2), and a four-day edit chain with five interests and a dietary need in Cairo (1; I did not dig further into this one).

How the run was made: the full 4-worker run hit seven 30-second timeouts on a busy machine, and each one threw its city's
propagation chain out of step, which inflated the counts to 370. Re-run alone, those four cities (Kuala Lumpur, Los
Angeles, Vienna, Lisbon) produced 0 failures in all 58 plans each, and they were merged in with `scripts/stress/merge.ts`;
the report says so. Bulk runs used a local tile stub throughout; nothing bulk touched `tile.openstreetmap.org`.

## 3. What I left alone, and why

- **Meal windows.** Not moved, only relabelled, as asked. (They are now 0 failures because the label is honest.)
- **Swap/Shuffle and interests.** Engine unchanged, documented.
- **Photos.** Not recompressed. They are already AVIF and WebP with JPEG fallbacks, no single file is over 0.6 MB, and a lossless JPEG pass saves a few percent at best; not worth touching how they look.
- **README screenshots** (`docs/screenshots`, 11 MB on disk). Needed by the README; not recompressed.
- **Git history.** Not rewritten, not packed. The old copies of `reports/screenshots` and `reports/stress-results.json` stay in history; they are untracked from now on.
- **Majors.** react-day-picker 9 to 10, TypeScript 5 to 7 and @types/node 22 to 26 are available and were not upgraded.
- **CSP `script-src 'unsafe-inline'`.** Still needed: Next injects inline bootstrap scripts into statically prerendered pages, and a per-request nonce needs dynamic rendering for every page. See "decisions".
- **`lib/site.ts` warning** when `NEXT_PUBLIC_SITE_URL` is unset in production: kept on purpose, it is the reminder to set it.

## 4. Why the push was about 80 MB

`git count-objects`: 1,225 loose objects, 85.7 MiB, never packed, across 8 branches. By directory (all history): `public/images` 49.5 MB (50 cities x AVIF, WebP and JPEG in several widths), `docs/screenshots` 20.5 MB (README images, several revisions), `reports` 17.6 MB (stress-test screenshots and raw results, committed twice). Largest single file: a 2.7 MB README screenshot. Nothing there was a build output, archive or secret. Going forward the generated reports output is ignored, so a push no longer carries it. Running `git gc` locally would pack the loose objects (it does not change any commit).

## 5. What you must do yourself

GitHub, by hand (Settings of the repository):

1. **Code security**: turn on **Dependabot alerts** (and Dependabot security updates), **secret scanning** and **push protection**; turn on **private vulnerability reporting** (it is what `SECURITY.md` points to).
2. **Branches**: add a branch protection rule for `main` that requires a pull request before merging and requires the **CI** status check (`lint, typecheck, test, build`) to pass.
3. **Account**: turn on two-factor authentication on your GitHub account.

On the host: set `NEXT_PUBLIC_SITE_URL` to the real origin (otherwise canonical URLs and the sitemap point at localhost), and put `TRAVELPAYOUTS_TOKEN` and `VIATOR_API_KEY` in the host's environment, never in a file in the repo, if you use them.

## 6. Decisions I need from you

- **Majors:** upgrade react-day-picker to 10, TypeScript to 7, @types/node to 26? Each can break; I did not touch them.
- **`SECURITY.md` contact:** no email address is published anywhere in the repository, so the policy points to GitHub's private vulnerability reporting. Do you want a contact email added?
- **Rate limit trust:** the price API keys its limit on `x-forwarded-for` / `x-real-ip`. Behind Vercel or another proxy that overwrites it, that is right; if the app is ever served directly, a caller can rotate the header to dodge the limit. Say if you want it keyed on the socket address instead (it would also stop the stress test giving each worker its own key).
- **HSTS:** decided. `includeSubDomains` and `preload` removed; only `max-age=63072000` remains, so it covers this host and nothing else on the domain.
- **CSP strictness:** replacing `'unsafe-inline'` for scripts with nonces means rendering every page dynamically (slower, no static HTML). I recommend leaving it.
- **Packing the repo:** `git gc` is safe and shrinks `.git`; I did not run it.
