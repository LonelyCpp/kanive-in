# Airline Print — Design Decisions

## D1: PDF via CSS @media print + browser dialog

**Decision:** Use `window.print()` with `@media print` CSS. No PDF library.

**Why:** This is a client-only SvelteKit project with no server routes. Adding a PDF library (jspdf, html2pdf) would introduce a dependency for something the browser already does well. The print dialog lets users save as PDF natively. This also keeps the ticket as live HTML that can be inspected, copied, and styled with familiar CSS.

## D2: Logo upload → compressed PNG data URL → localStorage

**Decision:** Read uploaded images via `FileReader`, compress raster images to max 200×200px PNG on a canvas. SVGs bypass compression and are stored as-is. Store as base64 data URLs in localStorage.

**Why:** PNG preserves transparency (unlike JPEG) — logos often have transparent backgrounds. The 200px cap keeps sizes manageable. SVGs are vector and cannot be rasterized without losing quality; they are stored directly.

## D3: All fields optional, blank fields omitted

**Decision:** No required fields. Every element on the ticket is conditional on its corresponding field being non-empty.

**Why:** User spec explicitly calls for this behavior ("if any field is left blank, remove the element"). This also handles the reality that users may not have all details from their aggregator — they can still generate a clean ticket with what they have. No validation errors to handle.

## D4: Airline per booking, not per flight

**Decision:** One airline name/logo/contact for the entire booking.

**Why:** User confirmed per-booking scope. Most aggregator bookings are on a single airline. Multi-airline itineraries are an edge case better handled by creating separate bookings.

## D5: Outbound + Return grouping (not flat segments)

**Decision:** Flights are explicitly grouped into Outbound and Return sections, each containing 1+ flight segments.

**Why:** User spec says "to and fro." This gives the ticket clear structure and matches how people think about round trips. Connecting flights within outbound/return are simply multiple segments in that section. Return section is omitted entirely if no return flights are added.

## D6: Form defaults = 1 passenger + 1 outbound + 0 return

**Decision:** Fresh form starts with minimum scaffolding, not empty.

**Why:** Starting completely empty forces the user to click "Add Passenger" and "Add Outbound Flight" before they can enter anything. Defaulting to 1 passenger + 1 outbound matches the most common use case (solo round-trip booking with at least an outbound) and immediately shows a preview skeleton.

## D7: Side-by-side layout, live preview

**Decision:** Desktop: form on the left scrolls independently, ticket preview on the right is sticky. Mobile: stacked vertically.

**Why:** User chose side-by-side. This gives an editorial "designing a ticket" feel — like InDesign or Canva. The live preview means no "Generate" button step; the ticket is always visible and updating. This is feasible because there's no heavy computation.

## D8: Save to localStorage on every change

**Decision:** Debounced auto-save to localStorage key `airline-print-booking`. Auto-restore on page mount.

**Why:** User-spec calls for persistence. Auto-save means the user never loses their work. Debouncing prevents excessive writes during rapid typing. Auto-restore on mount means the user can close the tab and come back to continue editing. No explicit "Save" button needed.

## D9: Magazine-editorial ticket design

**Decision:** Full visual redesign toward a "quiet editorial stationery" aesthetic: three typefaces (Playfair Display for voice, Inter for clarity, JetBrains Mono for codes), warm paper palette with dot grid surface, dotted perforation dividers between all sections, and a 3-column flight segment grid.

**Why:** The original "minimal typographic" direction was too generic. The user specified a detailed magazine-like aesthetic inspired by editorial layouts and vintage airline coupons. The three-typeface system creates clear information hierarchy — serif for display, sans for body, mono for machine codes. The paper palette (warm off-white, deep navy ink, brass accent) deliberately avoids looking like a UI or web page.

**Sub-decisions:**

- Fonts loaded from Google Fonts CDN with `preconnect` for performance
- Playfair Display 600/700 for masthead, city names, total
- Inter 400/500/600 for body, labels, contact info
- JetBrains Mono 400/500 for PNR, Booking ID, flight number, IATA codes, seat numbers
- Colours via CSS custom properties scoped to `.ticket`: `--paper`, `--ink`, `--ink-soft`, `--ink-muted`, `--accent`, `--paper-edge`
- Dot grid background via `radial-gradient` (18px spacing) — suppressed in print
- Dotted perforation separators (`.ticket-perf`) between every section

## D10: Navbar kept on page

**Decision:** The global navbar remains visible at `/tools/airline-print`. Hidden only in `@media print`.

**Why:** The original plan to hide it was deferred — removing it requires layout group restructuring across the entire site. The navbar aids navigation without significantly impacting the side-by-side layout. The print CSS already hides it for PDF output.

## D13: 3-column flight segment grid

**Decision:** Each flight segment is a `grid-template-columns: 1fr auto 1fr` layout with departure info on the left, flight details (plane icon, duration, flight number, class) centered, and arrival info on the right.

**Why:** Uses space more efficiently than vertically stacking the center section. Departure and arrival information (city, code, terminal, time, date) sit in their respective columns, making it easy to scan. The center column is narrow (`auto`) and contains only flight metadata — it doesn't push content down.

## D14: Terminal info inline with airport code

**Decision:** Terminal numbers are displayed next to IATA codes as `BLR | T2`, not as a separate "Terminal" row in the details section.

**Why:** More compact and follows real-world ticket conventions where terminal info is often part of the airport identifier. The pipe separator visually groups code + terminal as a unit.

## D15: Merged airline header + reference section

**Decision:** The airline info (logo, name, contact) and reference numbers (PNR, Booking ID) are merged into a single 2-column top section (`grid-template-columns: 1fr auto`). Airline on the left, PNR + Booking ID right-aligned on the right.

**Why:** Previously these were two separate sections separated by a perforation line, making the header area feel tall and fragmented. Merging them creates a compact, newspaper-masthead-like top block where all identification sits in one visual band.

## D16: Aggregator as compact issuer footer

**Decision:** The aggregator section is reduced from a full card (with subheading "Booking Info") to a minimal centered "Issued by" footer line. Total fare sits above it. "Generated by Airline Print" is appended to the same line when an aggregator is present.

**Why:** The ticket is issued by the aggregator — this is meta-information, not a ticket section. A compact single-line footer (with logo, name, and contact inline) respects this role. Standalone "Generated by Airline Print" footer for cases with no aggregator.

## D17: Right-aligned e-Ticket number

**Decision:** In the passenger section, the e-Ticket number is right-aligned (`justify-content: space-between`), mirroring the PNR / Booking ID pattern in the header.

**Why:** Creates visual symmetry — reference codes consistently right-align throughout the ticket. The passenger name anchors the left edge.

## D11: 24-hour time format

**Decision:** All times displayed in 24-hour format (14:30, not 2:30 PM).

**Why:** Standard on airline tickets internationally. More formal. Unambiguous. Takes less horizontal space in the ticket layout.

## D12: Per-passenger e-Ticket number, seat per passenger×flight

**Decision:** Each passenger has one e-Ticket number. Each passenger×flight combination has a seat number.

**Why:** Matches how real airline tickets work — the e-Ticket number is a document that covers all flights for that passenger, while seat assignments are per flight segment. The user confirmed this model (Model A).

## D18: Optional separate arrival date per flight

**Decision:** Add an optional `arrivalDate` field to each flight. If blank, the ticket preview falls back to the departure `date` for the arrival side, preserving existing behavior. The form shows "Arrival Date" side-by-side with "Date" in the flight block.

**Why:** Red-eye and long-haul flights often land on the day after departure (d+1). Previously the arrival side showed the same date as departure, which was incorrect for these flights. Adding an optional field keeps backward compatibility with saved bookings (missing field → undefined → falls back to departure date) while fixing the d+1 case when the user fills it in.

## D19: Reset button

**Decision:** Add a "Reset" button in the form toolbar that clears all fields back to the default state (1 passenger, 1 outbound flight, 0 return flights) after a `confirm()` dialog. Also clears localStorage.

**Why:** Users need a quick way to start a new booking without manually deleting every field. The confirmation dialog prevents accidental data loss. Clearing localStorage ensures the reset persists on reload.

## D20: JSON import via modal textarea

**Decision:** Replace the file-input "Upload JSON" with an **Auto-fill** button that opens a modal containing a textarea for pasting JSON. Clicking Import validates the shape and loads it into the form. The modal also contains the LLM prompt section.

**Why:** A textarea is more flexible than a file picker — users can paste JSON directly from an LLM chat without saving a file first. Putting both the JSON paste area and the LLM prompt in the same modal keeps the workflow in one place and declutters the form sidebar.

## D21: LLM extraction prompt in modal

**Decision:** Move the LLM prompt from an expandable sidebar section into the Auto-fill modal. The modal shows the JSON textarea at the top and the prompt (with Copy button) below a divider.

**Why:** The prompt and JSON input are part of the same workflow — they belong together. Removing the expandable sidebar section simplifies the form layout and reduces cognitive load. Users who don't use the LLM feature never see it; those who do see everything they need in one dialog.
