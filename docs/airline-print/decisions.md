# Airline Print — Design Decisions

## D1: PDF via CSS @media print + browser dialog

**Decision:** Use `window.print()` with `@media print` CSS. No PDF library.

**Why:** This is a client-only SvelteKit project with no server routes. Adding a PDF library (jspdf, html2pdf) would introduce a dependency for something the browser already does well. The print dialog lets users save as PDF natively. This also keeps the ticket as live HTML that can be inspected, copied, and styled with familiar CSS.

## D2: Logo upload → compressed data URL → localStorage

**Decision:** Read uploaded images via `FileReader`, compress to max 200×200px JPEG quality 0.7 on a canvas, store as base64 data URLs in localStorage.

**Why:** The project has no server. IndexedDB was considered (used by photo-selector tool) but adds complexity for just 2 images. Compression keeps data URLs small enough for localStorage's 5MB limit. Image quality at 200px is sufficient for a ticket header/footer logo.

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

## D9: Minimal typographic ticket style

**Decision:** The ticket preview uses strong typography hierarchy, ample whitespace, thin rules, serif section headings. No colored bands, no barcode areas, no boarding-pass imitation.

**Why:** "Editorial-style" and "beautiful, formal" in the user spec. A typographic design reads well in print and looks intentional. It also degrades gracefully — monochrome printers produce identical results. Airline-style replicas look gimmicky and tie the design to one carrier's aesthetic.

## D10: No navbar on this page

**Decision:** Hide the global navbar on `/tools/airline-print`.

**Why:** The page is a focused tool, not a marketing page. The navbar competes for space in the side-by-side layout and gets in the way of the editorial experience. The user can navigate back via browser back button or by typing a URL.

## D11: 24-hour time format

**Decision:** All times displayed in 24-hour format (14:30, not 2:30 PM).

**Why:** Standard on airline tickets internationally. More formal. Unambiguous. Takes less horizontal space in the ticket layout.

## D12: Per-passenger e-Ticket number, seat per passenger×flight

**Decision:** Each passenger has one e-Ticket number. Each passenger×flight combination has a seat number.

**Why:** Matches how real airline tickets work — the e-Ticket number is a document that covers all flights for that passenger, while seat assignments are per flight segment. The user confirmed this model (Model A).
