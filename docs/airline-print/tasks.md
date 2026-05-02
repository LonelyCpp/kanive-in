# Airline Print — Tasks

## Implementation

- [x] Create `/tools/airline-print` route (`src/routes/tools/airline-print/+page.svelte`)
- [x] Build form component with all booking fields (Booking ID, PNR, total cost)
- [x] Build airline details section (name, logo upload with compression, contact fields)
- [x] Build aggregator details section (name, logo upload with compression, contact fields)
- [x] Build passenger list with Add/Remove (name, type, e-Ticket number)
- [x] Build outbound flights list with Add/Remove (flight number, origin, destination, date, time, duration, terminal, class)
- [x] Build return flights list with Add/Remove (same fields as outbound)
- [x] Build per-passenger×flight seat number inputs
- [x] Implement image compression (canvas-based, max 200×200px, JPEG Q0.7)
- [x] Build ticket preview component (minimal typographic, conditional on non-empty fields)
- [x] Implement `@media print` CSS (hide form/nav, print ticket only, A4 margins)
- [x] Implement "Download PDF" button → `window.print()`
- [x] Implement localStorage auto-save (debounced) with key `airline-print-booking`
- [x] Implement localStorage auto-restore on page mount
- [x] Handle corrupt localStorage data (reset to defaults silently)
- [x] Responsive layout: side-by-side on desktop (form scrolls, preview sticky), stacked on mobile
- [ ] Hide navbar on this page (deferred — navbar hidden in print CSS; on-screen nav aids navigation)
- [x] Add page entry to `/tools` listing (`src/routes/tools/+page.svelte`)
- [x] Add `<svelte:head>` with page title "Airline Print — Tools"
- [ ] Test print output on A4 and Letter paper sizes
- [ ] Manual QA: fill form, verify preview, download PDF, reload page, verify restore
