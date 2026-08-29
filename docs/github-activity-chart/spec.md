# GitHub Activity Chart — Spec

Adds a GitHub contributions heatmap (last 12 months) to the main page, styled to match the site theme.

## Scope

A new section on the main page (`/`) that:

1. Fetches the contribution calendar server-side via the GitHub GraphQL API
2. Renders a 53-week × 7-day heatmap (GitHub profile style)
3. Shows a total contributions summary line above the grid

## User Flow

1. Visitor opens `/`
2. The server load (cached via ISR) queries GitHub GraphQL for the last 365 days of contributions for `lonelyCpp`
3. The chart renders between the hero and the "Latest" blogs section
4. If data is unavailable (no token, rate limit, outage) the section is omitted entirely — the last cached page keeps being served until a successful regeneration

## Data Source

- **API:** GitHub GraphQL v4, `contributionsCollection(from:, to:)` → `contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }`
- **Auth:** `GITHUB_TOKEN` env var (secret). Fine-grained PAT: no permission checkboxes needed, but **Repository access determines what's counted** — "Public repositories (read-only)" counts only public contributions; **"All repositories" is required to include private repo contributions** (implicit metadata read suffices). Org repos behind SAML SSO are never counted. A classic PAT with no scopes is public-only; `repo` scope works but is overpowered.
- **Username:** `lonelyCpp` (hardcoded, same as the GitHub icon link)
- **Range:** `from` = 365 days ago, `to` = today (rolling window)

## Caching

- `+page.server.ts` load sets `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800` via `setHeaders` (SvelteKit 2.20 removed the `revalidate` page option)
- Rendered page HTML (including chart data) is cached at the CDN edge for 24 hours (`s-maxage`); browsers revalidate on every navigation (`max-age=0`) so they always see current edge content
- **Deploy invalidates automatically:** Vercel's CDN cache key includes the deployment URL, so pushing a blog post (new deployment) serves a fresh homepage on the next request — no manual purge needed
- After expiry, regeneration runs in the background **while the cached page continues to be served** (stale-while-revalidate, up to 7 days for stale content)
- A failed regeneration hides the section (`calendar: null`) instead of erroring; the previously cached page keeps being served until a successful regeneration
- Manual fallback if ever needed: `vercel cache purge` CLI or dashboard → CDN → Caches → Purge

## Component

`src/routes/components/GithubActivityChart.svelte` (route-level shared component)

### Visual design

- **Bare heatmap** — no heading, no summary text, no color legend, no month/weekday labels (revised after first render; user asked to "keep it subtle")
- Grid: one column per week, 7 cells per column (Sun–Sat top to bottom)
- Leading/trailing cells outside the 365-day window render as empty (level 0)
- Cell size: 10px, 2px radius, 3px gap (fits the 720px content width exactly)
- Color ramp derived from the site theme (monochrome, `#ececec` → `#1a1d23`), defined as CSS custom properties on the grid
- Mobile (< ~720px): chart sits in a horizontal scroll container

### Main page section spacing

The three main-page sections (hero, activity chart, Latest blogs) use an even 48px gap: each section after the hero gets `margin-top: 48px`; the "Latest" heading's default browser margin is reset to avoid double-spacing. The hero is content-sized (`padding-top: 88px`, 56px on mobile) instead of fixed-height, so no dead space accumulates below the social icons.

### Data model

```ts
type ContributionDay = { date: string; count: number };
type GithubCalendar = {
	totalContributions: number;
	weeks: ContributionDay[][];
};
```

Grid alignment (padding, level mapping) is computed in the component; the server returns raw weeks as-is from the API.

## Failure Modes

| Case                       | Behavior                                        |
| -------------------------- | ----------------------------------------------- |
| `GITHUB_TOKEN` missing     | load returns `calendar: null`, section omitted  |
| GraphQL error / rate limit | same as above; stale cached page keeps serving  |
| Empty weeks / new account  | chart renders with all-empty cells, summary = 0 |

## In Scope

- Single user (`lonelyCpp`), hardcoded
- Last 12 months rolling window
- Month + weekday labels
- Total contributions summary
- Graceful hide on failure + ISR stale-while-revalidate
- Horizontal scroll on mobile

## Out of Scope

- Tooltips / hover details
- Dark mode ramp (site is light-only)
- Other users / dynamic username
- Year navigation (previous years)
- Per-repo breakdown, streak stats
- Client-side fetching or polling
