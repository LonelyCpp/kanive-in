# Recipes page — spec

A gallery page at `/recipes` showing scanned handwritten recipe cards as pinned cards on a fridge-style board. Clicking a card opens a fullscreen lightbox with zoom/pan. Tags are filterable. Recipes are deep-linkable via hash URLs.

## User flow

1. Visitor lands on `/recipes` (linked from the main navbar) and sees a board of recipe cards — white paper cards with soft shadows and slight deterministic rotations, like photos pinned to a fridge.
2. A filter row of tag chips sits above the board. Clicking a tag filters the grid (AND across selected tags). Clicking again deselects.
3. Clicking a card opens a fullscreen lightbox:
   - The scan opens with the whole page visible, contained in the image area (no scrolling needed); zoom via the +/− buttons, double-click, pinch (mobile), or Ctrl/Cmd+wheel; wheel/touch/scrollbar pan the scan like a document at any zoom.
   - The fit-to-screen button re-fits the whole page (zooming out below fit-width or in above it as needed) and scrolls back to the top; the default view re-applies after page changes, image loads, and window resizes until the user zooms manually.
   - Multi-page recipes show a pager (‹ 1 / 2 ›) below the image; the card thumbnail shows page 1.
   - Header (title + actions) and footer (note, tags) stay pinned; only the image area scrolls.
   - Prev/next arrows cycle through recipes in the current (filtered) order; keyboard ← → navigate, ESC closes.
   - Metadata (title, date, note, tags) is shown alongside the image.
   - Opening sets `history.replaceState` to `/recipes#<slug>`; closing removes it.
4. Loading `/recipes#<slug>` directly opens the lightbox on that recipe.
5. Backdrop click closes the lightbox. Background page scroll is locked while open.

## Data model

- Images: `static/recipes/<slug>.jpg` — scans cleaned up at scan time (document scanner app), no build-time image pipeline.
- Metadata: `src/lib/data/recipes.json`, typed via a `Recipe` interface in `src/lib/data/recipes.ts`:

```ts
interface Recipe {
	slug: string; // filename stem, used for hash + image paths
	title: string;
	date?: string; // ISO yyyy-mm-dd; omitted when the card is undated
	tags: string[]; // e.g. ["breakfast", "kerala"]
	note?: string; // optional one-liner, shown in lightbox
	images?: string[]; // optional multi-page paths; defaults to [/recipes/<slug>.jpg]
}
```

- Data lives in `src/lib/data/recipes.ts` and is imported (build-time) directly in `+page.svelte`. No server, no CMS.

## Fields

| Field  | Required | Shown on card             | Shown in lightbox     |
| ------ | -------- | ------------------------- | --------------------- |
| title  | yes      | yes (caption)             | yes                   |
| date   | no       | yes, if present (caption) | yes, if present       |
| tags   | yes      | yes (chips)               | yes (chips)           |
| note   | no       | no                        | yes                   |
| images | no       | first page                | all pages, with pager |

## Visual direction

- Fridge/pinned-card aesthetic: white card, thin border, soft shadow, rotation between ±1.5° derived deterministically from the slug hash (stable across renders).
- Card thumbnails are normalized to a 3:4 portrait box with `object-fit: contain` (letterboxing blends into the paper), so every card is the same height and captions align.
- Hover: card straightens and lifts (transform + shadow transition).
- Tag chips above the board filter the grid; matches the site's minimal styling.
- Responsive: 3 cols desktop → 2 tablet → 1 mobile.

## Lightbox implementation

- Custom zoom/pan (wheel + pointer drag + pinch via pointer events) — no zoom library.
- Focus is trapped in the lightbox while open; body scroll locked.
- Prev/next wrap around within the currently filtered list.

## In scope

- `/recipes` route + navbar link in `NavbarMain.svelte`
- Grid board, tag filter, lightbox with zoom/pan/keyboard, hash deep links
- JSON + typed interface, placeholder recipe until scans exist

## Out of scope

- Build-time image processing / thumbnail generation (scans optimized at scan time)
- Per-recipe sub-routes, SSR, OG images
- Search, sort, favorites, rich metadata (cuisine, source, difficulty)
- Upload/CRUD UI — adding a recipe = drop image in `static/recipes/` + JSON entry
