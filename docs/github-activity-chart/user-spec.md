# GitHub Activity Chart — User Spec (raw)

> Initial request:
>
> "add my github activity chart on the main page"

Answers from the grill session:

- **Data source:** GitHub GraphQL API + token (`contributionsCollection`)
- **Fetch location:** `+page.server.ts` load on the main page (no dedicated endpoint)
- **Time range:** Last 12 months (rolling, like the GitHub profile page)
- **Colors:** Match site theme (not GitHub green)
- **Tooltips:** None — just the grid plus a total contributions summary
- **Placement:** New section between the hero and the "Latest" blogs section
- **Failure mode:** Cache the last fetched data and serve that (stale-while-revalidate)
- **Mobile:** Horizontal scroll container
