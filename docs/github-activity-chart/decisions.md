# GitHub Activity Chart — Design Decisions

## D1: GitHub GraphQL API with a token (not third-party services)

**Decision:** Fetch contribution data from GitHub's GraphQL API (`contributionsCollection`) using a `GITHUB_TOKEN` secret, server-side.

**Why:** User chose it over a third-party contributions API and over image embeds (ghchart). It's the official, accurate source with no dependency on an external free service, and returning real JSON enables full styling control. Tradeoff: requires a token setup step.

## D2: Fetch in `+page.server.ts` load, not a dedicated endpoint

**Decision:** The GraphQL call lives in the main page's `+page.server.ts` load function.

**Why:** The chart is only used on `/`. A separate `/api/github-contributions` endpoint would add surface area with no second consumer. The load function also composes naturally with route-level ISR caching.

## D3: ISR via `export const revalidate = 3600` (stale-while-revalidate caching)

**Decision:** Cache the rendered page at the edge for 1 hour with SvelteKit/Vercel ISR. On regeneration failure, the stale cached page keeps being served. No in-memory or Redis caching layer.

**Why:** User explicitly asked "can we cache the last fetched data and serve that?" Vercel's ISR gives exactly stale-while-revalidate semantics for free: after the hour elapses, visitors get the cached page while a fresh one is generated in the background; a failed regeneration never evicts the previous good page. In-memory caching is unreliable across serverless instances. Tradeoff accepted: the entire main page (including the blog list) is cached for 1h.

## D4: Hide section on failure rather than placeholder

**Decision:** If the token is missing or the API call fails, the load returns `calendar: null` and the page omits the section silently.

**Why:** Combined with D3, visitors essentially never hit this path — they see the last cached page. A visible "unavailable" placeholder would only appear during a cold start without a token, which is a setup problem the site owner should notice, not something to show visitors.

## D5: Last 12 months, rolling window

**Decision:** `contributionsCollection` is queried from 365 days ago to today.

**Why:** Matches the GitHub profile page's rolling year. A calendar-year window resets every January and looks sparse for months.

## D6: Colors matched to site theme (monochrome ramp)

**Decision:** The heatmap uses a greyscale ramp derived from the site palette: empty `#ececec` up to full ink `#1a1d23`, defined as CSS custom properties scoped to the component.

**Why:** User chose "Match site theme" over GitHub green. The site's light theme is neutral (`#f9f9f9` background, `#1a1d23` ink) with no accent color, so a monochrome intensity ramp reads naturally as "more activity = darker" without introducing a foreign hue.

## D7: No tooltips, but keep a total summary + labels

**Decision:** No hover tooltips on cells. The section shows a heading, a total-contributions summary line, month labels on top, and weekday labels (Mon/Wed/Fri) on the left.

**Why:** User explicitly picked "No tooltips" from the options where that choice included a total count summary. Month/weekday labels are needed for the grid to be readable at all without tooltips.

## D8: Horizontal scroll on mobile

**Decision:** The ~700px grid sits in an `overflow-x: auto` container on small screens.

**Why:** Shrinking 53 weeks into a phone viewport makes cells unusably small; hiding the chart removes the feature from half of visitors. Scrolling matches GitHub's own mobile profile behavior and is the least surprising option.

## D10: Bare grid — no heading, summary, or labels (supersedes D7)

**Decision:** The section renders only the heatmap cells. The "GitHub activity" heading, the total-contributions summary line, and the month/weekday labels are all removed. The section keeps an `aria-label` for accessibility. Also: the total summary string was the only place the contribution count was displayed.

**Why:** After seeing the first render, the user asked to "keep it subtle" and remove the title, subtitle, and legend. The GitHub-style grid is recognizable without any text, and the section sits directly under the hero so context is obvious. Labels exist mostly for tooltip-less readability, but the user prefers the visual quietness. If orientation is missed later, month labels can be re-added without touching data plumbing.

## D11: Even 48px section spacing on the main page

**Decision:** Each main-page section after the hero (`GitHub activity` chart, `FeaturedBlogs`) gets `margin-top: 48px` via a shared `.section` class in `+page.svelte`. The "Latest" `h2` default browser top margin is reset (`margin: 0 0 12px 0`) inside `FeaturedBlogs.svelte`.

**Why:** The three sections were unevenly spaced: the hero (fixed height) ran directly into the chart (gap ≈ 0), while the chart-to-Latest gap came only from the browser's default `h2` margin (~16px). A consistent 48px gap between all three sections makes the page rhythm even; resetting the `h2` margin prevents double-spacing so the rendered gap is truly 48px everywhere.

## D12: Hero is content-sized, not fixed-height (supersedes part of D11)

**Decision:** The hero drops `height: 320px` (260px mobile) and `justify-content: center`; it now sizes to its content with `padding-top: 88px` (56px mobile). The 48px `.section` margins from D11 stay.

**Why:** After D11 the user reported the icons-to-chart gap was still much larger than the chart-to-Latest gap. Root cause: the fixed-height hero vertically centered its content, leaving ~90px of dead whitespace _inside_ the hero box below the icons, which stacked on top of the chart's 48px margin (~140px total) while chart→Latest stayed 48px. Making the hero content-sized removes the internal dead space so both gaps are exactly 48px. `padding-top: 88px` keeps the "Hello World" heading at roughly its original vertical position (matching the old centered layout's top whitespace) so only the bottom dead space disappears.

## D9: Cache-Control headers instead of `export const revalidate` (supersedes D3)

**Decision:** Cache the rendered page (with chart data) via `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`, set with `setHeaders` inside the `+page.server.ts` load. No in-memory or Redis caching layer.

**Why:** User explicitly asked "can we cache the last fetched data and serve that?" The edge cache serves the cached HTML; after `max-age` elapses, a fresh render is generated in the background while the stale response keeps being served — the same stale-while-revalidate semantics D3 aimed for. A failed GitHub fetch inside a fresh render returns `calendar: null` (section hidden, per D4), so the page never hard-fails. In-memory caching is unreliable across serverless instances. Tradeoff accepted: the entire main page (including the blog list) is cached for 1h.

**Why the change from D3:** SvelteKit 2.20 (this project) no longer accepts `export const revalidate` in `+page.ts` / `+page.server.ts` — the build fails with "Invalid export 'revalidate'". `setHeaders` with `cache-control` is the documented replacement for caching page HTML on SSR, and Vercel's edge honors `max-age` + `stale-while-revalidate` for server-rendered responses.

## D13: Cache duration raised to 24h (supersedes D9's duration)

**Decision:** `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` — 24h fresh, stale-servable up to 7 days while background regeneration runs.

**Why:** User felt 1h was too frequent for a contributions chart that changes at most daily ("cache the data for 1 day"). Contribution data only changes when the user pushes code, so 24h freshness is imperceptible in practice, and the longer SWR window (7 days) means GitHub outages/rate limits never break the page. Bonus: ~24× fewer GitHub GraphQL calls, which is irrelevant at this traffic level but free. Tradeoff unchanged in kind, extended in time: new blog posts can take up to a day to appear on the homepage.

## D14: `max-age=0, s-maxage=86400` split — CDN caches, browsers revalidate (supersedes D13's header value)

**Decision:** `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`. The 24h freshness and 7d stale window move entirely to `s-maxage` (CDN); browsers get `max-age=0` and revalidate against the edge on every navigation.

**Why:** Researching deploy-time invalidation revealed two facts. First, Vercel's CDN cache key includes the deployment URL, so **a new deployment (e.g., a blog push) naturally invalidates the homepage cache** — no manual purge needed (the `vercel cache purge` CLI / dashboard purge exist as fallbacks but should rarely be necessary). Second, D13's `max-age=86400` cached the page in _visitors' browsers_ for 24h, which deployments cannot invalidate — a visitor could see a day-old homepage regardless of deploys. Vercel's docs recommend exactly this `max-age=0, s-maxage=N` pattern for server-rendered pages whose content changes on deploy. Net behavior: blog posts appear immediately on push (new deployment → cold CDN cache), chart data refreshes at most daily at the edge, browsers always see current edge content. Vercel Edge Config + Cron storage was considered for deploy-independent chart refreshes and rejected as over-engineering — revisit only if intraday chart freshness is ever wanted.
