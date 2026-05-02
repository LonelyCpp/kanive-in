# Airline Print — Tasks

## Implementation

- [ ] Create `/tools/airline-print` route (`src/routes/tools/airline-print/+page.svelte`)
- [ ] Build form component with all booking fields (Booking ID, PNR, total cost)
- [ ] Build airline details section (name, logo upload with compression, contact fields)
- [ ] Build aggregator details section (name, logo upload with compression, contact fields)
- [ ] Build passenger list with Add/Remove (name, type, e-Ticket number)
- [ ] Build outbound flights list with Add/Remove (flight number, origin, destination, date, time, duration, terminal, class)
- [ ] Build return flights list with Add/Remove (same fields as outbound)
- [ ] Build per-passenger×flight seat number inputs
- [ ] Implement image compression (canvas-based, max 200×200px, JPEG Q0.7)
- [ ] Build ticket preview component (minimal typographic, conditional on non-empty fields)
- [ ] Implement `@media print` CSS (hide form/nav, print ticket only, A4 margins)
- [ ] Implement "Download PDF" button → `window.print()`
- [ ] Implement localStorage auto-save (debounced) with key `airline-print-booking`
- [ ] Implement localStorage auto-restore on page mount
- [ ] Handle corrupt localStorage data (reset to defaults silently)
- [ ] Responsive layout: side-by-side on desktop (form scrolls, preview sticky), stacked on mobile
- [ ] Hide navbar on this page
- [ ] Add page entry to `/tools` listing (`src/routes/tools/+page.svelte`)
- [ ] Add `<svelte:head>` with page title "Airline Print — Tools"
- [ ] Test print output on A4 and Letter paper sizes
- [ ] Manual QA: fill form, verify preview, download PDF, reload page, verify restore
