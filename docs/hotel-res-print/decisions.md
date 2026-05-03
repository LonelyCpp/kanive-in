# Hotel Reservation Print — Design Decisions

## D1: Single page at `/tools/hotel-reservation`, side-by-side layout

**Decision:** Use the same single-page, side-by-side form + live preview pattern as airline-print. Route: `/tools/hotel-reservation`. Added to the `/tools` grid.

**Why:** The original user-spec proposed a two-page flow (`/hotel-reservation` → `/hotel-reservation/preview`), but the existing airline-print feature already proves the single-page model works well. Two pages would require inter-page state management (localStorage read on mount + redirect logic) for no UX benefit. Keeping it consistent means users already familiar with airline-print know exactly how this tool works.

## D2: Guest count derived from name list length

**Decision:** Remove the separate "Number of guests" field from the form. The guest count is always `guestNames.length`. The preview shows the count as derived text (e.g., "3 guests").

**Why:** Having both a manual count and a dynamic list creates a drift risk (list has 3 names, count says 2). There is no legitimate use case for these to differ — if a guest isn't named, they shouldn't be on the slip. This matches the airline-print passenger model.

## D3: Auto-fill with LLM prompt, same modal pattern

**Decision:** Include the Auto-fill modal with JSON textarea + LLM prompt copy, identical to airline-print.

**Why:** Hotel booking confirmations from aggregators (Booking.com, Agoda) arrive as unstructured text/email. The LLM extraction workflow is just as useful here as it is for flight tickets. Skipping it would create a feature gap between the two tools for no good reason.

## D4: Nights = `Math.max(0, dayDiff)`, no validation

**Decision:** Compute nights as the difference in calendar days between check-out and check-in. If the result is ≤ 0, omit the nights display entirely. No validation errors shown.

**Why:** Same "empty field omission" philosophy as airline-print. Same-day checkouts (0 nights) or reversed dates are silently handled by omission. The user can self-correct when the preview looks wrong. Adding validation would break the tool's consistent "no errors, just hide" behavior.

## D5: Image auto-compress instead of 500 KB rejection

**Decision:** Follow the airline-print image pipeline: FileReader → canvas resize to 200px max → PNG data URL. SVGs stored as-is. Ignore the original spec's "Max 500 KB per image, reject with error."

**Why:** A 200px PNG is effectively always under 500 KB, so the limit is redundant. Auto-compression is a better UX — users don't need to think about file sizes or encounter error states. Rejecting uploads adds error-state UI that airline-print doesn't have, creating inconsistency.

## D6: No repeating print header/footer

**Decision:** Content flows naturally across pages in print. No running headers or footers that repeat "Hotel name + Confirmation #" on every printed page.

**Why:** The original spec requested repeating headers/footers, but implementing this reliably in CSS `@media print` requires complex tricks (`running()`, table-header-group, etc.) with spotty browser support. Most hotel slips fit comfortably on a single A4 page, so the complexity isn't justified. This keeps the print CSS simple and consistent with airline-print.

## D7: Exact visual clone of airline-print

**Decision:** Re-use the airline-print visual system wholesale: same three typefaces (Playfair Display, Inter, JetBrains Mono), same warm paper palette with dot grid, same dotted perforation dividers, same label/value hierarchy, same `@media print` rules.

**Why:** The spec explicitly says "Follow the visual design used in the airline-print feature." The editorial stationery aesthetic works for hotel slips just as well as flight tickets. Re-using the exact system means zero new design decisions, faster implementation, and a consistent brand feel across tools. Only the masthead text and section content change.

## D8: Default form state = 1 room, 1 empty guest

**Decision:** Fresh form starts with room count = 1 and one empty guest name input. All other fields blank.

**Why:** Starting with zero guests would force the user to click "Add Guest" before typing a name. Defaulting to 1 room + 1 guest matches the most common use case (single room, primary guest) and immediately shows a preview skeleton. This mirrors airline-print's "1 passenger + 1 outbound flight" default.

## D9: Explicit add/remove for guest names

**Decision:** Each guest name row has a remove (×) button. A "+ Add Guest" button sits below the list. No auto-add or auto-remove behavior.

**Why:** Predictable, user-controlled list management. Matches airline-print's passenger interaction exactly. Auto-adding rows can create accidental empty entries; auto-removing can surprise users who tabbed away mid-typing.

## D10: Section order: masthead → hotel → confirmation → stay → guests → total → aggregator

**Decision:** The printed slip follows a 14-step section order with dotted perforation dividers between each major block.

**Why:** Mirrors the airline-print rhythm (identification → details → people → money → meta). Each section is self-contained and scannable. The stay block uses a 3-column grid (check-in / nights / check-out) inspired by the flight segment layout, creating visual consistency between the two tools.

## D11: localStorage key = `hotel-reservation-booking`

**Decision:** Use a distinct localStorage key so hotel data and airline data never collide.

**Why:** A user might have both tools open or switch between them. Shared keys would cause data corruption or unexpected overwrites.
