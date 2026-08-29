# GitHub Activity Chart — Tasks

- [ ] Create PAT (no scopes needed for public data) and set `GITHUB_TOKEN` in Vercel (local testing can use `GITHUB_TOKEN=$(gh auth token) npm run dev`)
- [x] Add `+page.server.ts` with GraphQL fetch, 12-month range, `Cache-Control` SWR headers, `calendar: null` fallback
- [x] Build `GithubActivityChart.svelte` (grid, labels, theme ramp, horizontal scroll)
- [x] Wire section into `+page.svelte` between hero and FeaturedBlogs
- [x] `npm run check` passes (0 errors; 1 pre-existing warning in whats-in-a-url)
- [x] `npm run lint` passes
- [x] Verify visually with `npm run dev`:
  - [x] without token → section omitted, page intact
  - [x] with token → 366 cells, all 5 levels, "3,861 contributions in the last year"
  - [x] `cache-control: public, max-age=3600, stale-while-revalidate=86400` header present
- [x] `npm run build` passes
  - Note: SvelteKit 2.20 rejected `export const revalidate` (removed) — replaced with `setHeaders` cache-control, see decisions.md D9

## Follow-up revision (after first render)

- [x] Remove heading, summary line, and month/weekday labels — bare grid (D10)
- [x] Even spacing: 48px gap between hero / chart / Latest (D11), hero content-sized (D12)
- [x] Re-verified: `check`, `lint`, `build` all pass
- [x] Cache raised to 24h fresh + 7d stale-while-revalidate (D13); split into `max-age=0, s-maxage=86400` so deploys invalidate the CDN but browsers never hold stale pages (D14)
