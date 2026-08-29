# Decisions

## Pinned-card (fridge) aesthetic over corkboard or flat grid

User picked "Fridge / pinned cards": white cards, soft shadows, slight random rotation, hover straightens. Matches the minimal portfolio better than a textured corkboard.

**Why:** Consistency with the rest of the site; no texture assets needed.

## Rotation derived from slug hash, not random

Each card's rotation (±1.5°) is computed deterministically from its slug.

**Why:** Pure `Math.random()` in the component re-rotates cards on every hydration/re-render and can cause hydration mismatches. A hash is stable.

## No background-removal pipeline; scans are cleaned at scan time

Instead of rembg/ImageMagick post-processing, the workflow is: scan with a document scanner app (auto-crop, deskew, white background), optimize size, drop into `static/recipes/`. The "physical card" look comes entirely from CSS.

**Why:** The paper is the content — AI cutouts would risk mangling handwriting edges. A scanner app produces clean results for free and avoids a build step. ImageMagick flood-fill (`-fuzz`) remains the fallback for scans with shadows.

## JSON in `src/lib/data`, images in `static/recipes`

Metadata lives in `src/lib/data/recipes.json` imported at build time; images are static files named `<slug>.jpg`.

**Why:** Adding a recipe is a two-file change with no server. Build-time import gives free typing via the `Recipe` interface and works with prerendering. (Supersedes the earlier idea of storing JSON alongside images.)

## Optional `image` field overrides the `<slug>.jpg` convention

`Recipe.image?: string` lets an entry point at a different file; `recipeImageUrl()` falls back to `/recipes/<slug>.jpg`.

**Why:** The placeholder recipe ships as an SVG (no ImageMagick in the environment to rasterize a fake scan), and it future-proofs entries whose scan extension isn't `.jpg` — without forcing every real entry to maintain the field.

## Date formatting is manual, not `toLocaleDateString`

`formatRecipeDate()` renders ISO dates as `10 Jun 2024` with a hardcoded month table.

**Why:** Locale-dependent formatting can differ between server-rendered HTML and client hydration, causing hydration mismatches.

## `date` is optional

The first real batch of scans (Aug 2026) had no dates written on any card. `date?: string` and the caption/date render only when present.

**Why:** Fabricating a date would be misleading; omitting keeps the board honest. Add dates later if the cards turn out to be dated.

## Multi-page recipes via optional `images: string[]`

Two scans of shahi paneer turned out to be page 1 (shorthand draft) and page 2 (neat rewrite) of the same recipe. `images` lists the page paths explicitly; single-page recipes omit it and default to `/recipes/<slug>.jpg`. Cards render page 1; the lightbox shows a ‹ 1 / 2 › pager. (Supersedes the single optional `image` override field.)

**Why:** One recipe = one card on the board; splitting pages into separate cards would duplicate the dish and break the tag filter's mental model.

## Metadata transcribed from scans by general-purpose subagents

Titles, notes, and tags for the first batch were produced by subagents reading the scanned images ("nano banana" wasn't available as a configured agent in this repo). Tags follow a controlled vocab: region (mangalorean, coastal, south-indian, north-indian), course (main, snack, dessert), diet (vegetarian, non-vegetarian), plus dish markers (chicken, fish, sweet, curry).

**Why:** Records provenance of the descriptions and the intended tag vocabulary for future batches — keep new tags consistent with this set.

## Uniform 3:4 card thumbnails with `object-fit: contain`

Scans have varying aspect ratios; without normalization each card's height differed and captions misaligned. Every thumbnail now renders in a 3:4 box, contained (not covered).

**Why:** `cover` would crop recipe content — unacceptable for the primary artifact. Letterboxing is invisible against the white paper card. `aspect-ratio` + grid keeps every caption aligned.

## Lightbox scrolls; wheel/touch only zoom when zoomed (or Ctrl/wheel)

The lightbox is a scroll container (`overflow-y: auto`) so long notes/tags never get cut off on small screens. Wheel over the image passes through to scroll while at 1x _and_ the content overflows; once zoomed (or with Ctrl+wheel, which is the browser zoom convention) it zooms. Touch mirrors this: `touch-action: pan-y` at 1x, `none` when zoomed. Prev/next recipe buttons are `position: fixed` so they stay reachable while scrolling. A fit-to-screen header button resets zoom/pan and scrolls the image back into view.

**Why:** Zoom and scroll compete for the same gestures. Scoping zoom to the zoomed state (plus explicit Ctrl modifier and the fit button) keeps both usable without a visible scrollbar trap.

## Wheel never zooms at 1x; zoom is fully explicit (supersedes the gesture arbitration above)

The overflow-dependent arbitration ("wheel scrolls only when content overflows") was fragile — users got zoom when they expected scroll. Final model: unmodified wheel is never intercepted at 1x, so the lightbox scrolls natively whenever it can. Zooming requires an explicit gesture: +/− buttons in the header, double-click, pinch (mobile), or Ctrl/Cmd+wheel (which also captures trackpad-pinch wheel events). Once zoomed, wheel continues to zoom; the fit-to-screen button or double-click returns to 1x, where native scroll resumes.

**Why:** Predictability beats cleverness. A wheel that sometimes zooms and sometimes scrolls — depending on an invisible overflow condition — reads as broken. Explicit zoom affordances cost two small buttons and remove all ambiguity.

## Native scroll viewport with width-based zoom (supersedes all transform pan/zoom models)

The transform-based model (`translate/scale` + `overflow: hidden`) left the image area with no native scroller, so every gesture had to be hand-routed and wheel kept conflicting with zoom. Final model: the viewport is a real scroll container (`overflow: auto`); the image's width is `scale × 100%` (fit-to-width at 1x, so tall scans read like a document), and the browser owns wheel/touch/scrollbar panning at every zoom level. Custom code shrinks to: Ctrl/Cmd+wheel zoom (also captures trackpad pinch), touch pinch, and one-finger drag-pan while zoomed (adjusts `scrollTop/Left` under `touch-action: none`; at 1x `touch-action: pan-y` lets the browser scroll). Fit-to-screen resets scale and scrolls to the top.

**Why:** Native scrolling cannot "not work" — it's the platform's most tested code path. Fit-to-width + vertical scroll also matches how people actually read a tall handwritten page, and header/footer stay pinned so metadata is never cut off.

## Fit-to-screen fits the height; the zoom floor is dynamic

`fitToScreen()` computes `fitScale = (viewportHeight / viewportWidth) × naturalAspect` and clamps to it, so the whole page is visible without scrolling. Because zoom is width-based, fitting a tall scan on a wide screen means zooming out below fit-width — so the zoom floor is `min(1, fitScale)` (recomputed on image load and resize), not a hard 1. Initial view remains fit-width (scale 1).

**Why:** "Fit" that leaves part of the page out isn't fit. Making the floor dynamic keeps the zoom-out button consistent with the fitted state instead of fighting it.

## Contained (whole page visible) is the default view

Opening a recipe, changing pages, loading an image, and resizing all re-apply the fitted view (`scale = min(1, fitScale)`) unless the user has zoomed manually (`userZoomed` flag; double-click back to the fitted state clears it). Manual zoom (buttons, pinch, Ctrl+wheel, fit button) sets the flag so resize/load events stop re-fitting.

**Why:** The fitted view is the right starting point for reading a handwritten page; silently re-fitting after the user has deliberately zoomed would discard their intent, so the flag arbitrates.

## Mobile board is 2 columns with hairline dividers (no 1-column breakpoint)

On phones the grid stays 2-up — thumbnails stay thumbnail-sized — and each card gets a subtle bottom border (`--on-surface-underline-color`) with bottom padding. Grid rows stretch, so the dividers align across a row.

**Why:** The original single-column layout made scans full-width (not thumbnails) and left a caption visually running into the next card's scan. The hairline gives each card a clear end without heavy card chrome.

## Lightbox viewport uses `flex: 1 0 62vh`

The image area has a definite, content-independent flex basis so the image's `max-height: 100%` resolves correctly; extra space is distributed by `flex-grow`. (The earlier `flex: 1` + `min-height: 0` only worked because nothing ever scrolled.)

**Why:** Percentage heights need a resolvable parent height; a content-based basis would make scans render at natural size on overflow.

## Hash-based deep links instead of sub-routes

Open recipe is encoded as `/recipes#<slug>` via `history.replaceState`; on load the hash opens the lightbox directly.

**Why:** Shareable without new routes, SSR machinery, or OG image generation — appropriate for a personal gallery.

## Custom zoom/pan instead of a library

Lightbox zoom implemented with wheel + pointer events (drag, pinch) in `RecipeLightbox.svelte`.

**Why:** Small, self-contained behavior; avoids adding a dependency for one component. Handwritten text is small, so zoom is essential, but the feature surface is tiny.

## Minimal metadata (title, date, tags, optional note)

**Why:** User explicitly chose the minimal set; filename + JSON is the lowest-friction maintenance model for a handwritten archive.
