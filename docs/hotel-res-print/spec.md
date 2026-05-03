# Hotel Reservation Print — Spec

Generates a clean, minimal, A4-printable summary of a hotel booking from user-entered details.

## Scope

A single-page tool at `/tools/hotel-reservation` that:

1. Collects booking details via a form sidebar
2. Renders a live editorial slip preview
3. Produces a print-friendly PDF via the browser's native print dialog

## User Flow

1. User navigates to `/tools/hotel-reservation`
2. If saved data exists in localStorage, form auto-fills with last booking
3. If no saved data: form starts with **1 room, 1 empty guest name field**
4. User fills in form fields; slip preview updates live on the right
5. Optional: User clicks **Auto-fill** to open a modal. They can paste JSON directly, or copy the LLM prompt, paste it with their booking confirmation into any LLM, then paste the resulting JSON back into the modal and click Import
6. User clicks **Download PDF** → browser print dialog opens (save as PDF)
7. Every time the form changes, data is saved to localStorage
8. User clicks **Reset** to clear everything and start fresh

## Data Model

### Hotel

| Field          | Type                          | Notes                        |
| -------------- | ----------------------------- | ---------------------------- |
| Name           | string                        | required (form-level)        |
| Address        | string (multiline)            | required (form-level)        |
| Phone          | string                        |                              |
| GPS coordinates| string                        | free text, e.g. "12.9716° N, 77.5946° E" |
| Logo           | image (FileReader → data URL) | compressed ≤200px, PNG. SVG stored as-is |

### Booking Confirmation

| Field               | Type   | Notes                                          |
| ------------------- | ------ | ---------------------------------------------- |
| Confirmation number | string | required (form-level)                          |
| Booking PIN         | string | grouped with confirmation to disambiguate from postal PIN |

### Stay

| Field          | Type   | Notes                                              |
| -------------- | ------ | -------------------------------------------------- |
| Check-in date  | date   | required (form-level)                              |
| Check-in time  | time   | 24-hour                                            |
| Check-out date | date   | required (form-level)                              |
| Check-out time | time   | 24-hour                                            |
| Nights         | number | derived: `Math.max(0, dayDiff)`. Omitted if ≤ 0    |

### Guests & Rooms

| Field          | Type     | Notes                                              |
| -------------- | -------- | -------------------------------------------------- |
| Number of rooms| number   | defaults to 1                                      |
| Guest names    | string[] | dynamic list, add/remove. Count derived from length |

### Price

| Field       | Type   | Notes                              |
| ----------- | ------ | ---------------------------------- |
| Currency    | select | INR, USD, EUR, GBP, AED, SGD       |
| Total price | number | single value, no breakdown         |

### Booked Via (Aggregator)

| Field    | Type                          | Notes                        |
| -------- | ----------------------------- | ---------------------------- |
| Name     | string                        |                              |
| Phone    | string                        |                              |
| Website  | string                        |                              |
| Logo     | image (FileReader → data URL) | compressed ≤200px, PNG       |

## Relationships

```
Booking
  ├── Hotel              (name, address, phone, gps, logo)
  ├── Confirmation       (number, pin)
  ├── Stay               (checkInDate, checkInTime, checkOutDate, checkOutTime, nights)
  ├── Guests             (roomCount, names[])
  ├── Price              (currency, total)
  └── Aggregator         (name, phone, website, logo)
```

## "Empty field → remove element" Rule

Any field left blank in the form is omitted from the slip preview. No validation errors. Examples:

- No guest names entered → Guests section not shown (but room count may still appear)
- No logo uploaded → logo element not shown
- No aggregator name → entire aggregator footer omitted
- No check-in/out times → only dates shown
- Invalid date range (checkout ≤ checkin) → Nights omitted

## Slip Visual Design

Follows the **airline-print** visual system exactly. See `docs/airline-print/spec.md` for full typography, palette, and surface details.

### Typography (same three-typeface system)

| Typeface             | Usage                                                      | Weights       |
| -------------------- | ---------------------------------------------------------- | ------------- |
| **Playfair Display** | Masthead, hotel name, total price                          | 600, 700      |
| **Inter**            | Body copy, labels, guest names, contacts                   | 400, 500, 600 |
| **JetBrains Mono**   | Confirmation number, PIN, dates, GPS, room count           | 400, 500      |

### Color Palette (identical to airline-print)

CSS custom properties scoped to `.ticket`:

| Variable       | Value              | Usage                         |
| -------------- | ------------------ | ----------------------------- |
| `--paper`      | `hsl(36 30% 96%)`  | Ticket background             |
| `--ink`        | `hsl(220 45% 12%)` | Primary text (deep navy)      |
| `--ink-soft`   | `hsl(220 20% 38%)` | Secondary text                |
| `--ink-muted`  | `hsl(220 15% 60%)` | Captions, fine print          |
| `--accent`     | `hsl(30 55% 45%)`  | Brass/ochre — icon accent     |
| `--paper-edge` | `hsl(36 15% 85%)`  | Borders, dotted lines         |

### Surface & Dividers

- Warm off-white background (`--paper`) with subtle 18px dot grid (`radial-gradient`)
- Thin `--paper-edge` border, soft layered shadow
- `.ticket-perf` — `2px dotted` line (`--paper-edge`) between all major sections

### Icons

From `@iconify/svelte` (`mdi:` Material Design Icons):

| Icon                | Placement                              |
| ------------------- | -------------------------------------- |
| `mdi:bed`           | Center of stay segment (check-in ↔ check-out) |
| `mdi:hotel`         | Optional, near hotel name              |

## Slip Section Layout

### Section order

1. **Masthead** — "Hotel Reservation" in Playfair Display, centered
2. **Perforation**
3. **Hotel block** — 2-column grid: logo + name (left), address + phone + GPS (right-aligned or below)
4. **Perforation**
5. **Confirmation block** — Confirmation # + PIN, right-aligned or prominent
6. **Perforation**
7. **Stay block** — Check-in (date + time) ↔ Check-out (date + time), with nights count centered between them, bed icon
8. **Perforation**
9. **Guests block** — "{roomCount} room(s) · {guestCount} guest(s)" summary, then the guest name list
10. **Perforation**
11. **Total** — Currency + amount, right-aligned in Playfair Display
12. **Perforation**
13. **Aggregator footer** — "Booked via [logo] {name} · contact" compact centered line. Omitted if no aggregator name.
14. **Fallback footer** — standalone "Generated by Hotel Reservation Print" when no aggregator

### Stay segment layout

Inspired by the flight segment grid:

- `grid-template-columns: 1fr auto 1fr`
- Left column: `label` "Check-in", `value-lg` date, `value-mono` time
- Center column: bed icon with dashed lines, `segment-duration`-style "{n} nights"
- Right column: `label` "Check-out", `value-lg` date, `value-mono` time

### Guest list

- Room count + guest count shown as a single compact summary line (label style)
- Each guest name is a `.value` row. Simple vertical list.

### Total Fare

- Flex row, `space-between`. "Total" label left, amount right in Playfair Display (26px).

## Print / PDF

- CSS `@media print` hides form sidebar, navbar, and all interactive elements.
- Only the slip preview is printed.
- Page size: A4 portrait, 10mm margins.
- Background becomes pure white (`#fff`). Dot grid hidden. Shadows hidden.
- Solid 1px black border around ticket card.
- Dotted perforation lines preserved (color changes to `#999`).
- `window.print()` via "Download PDF" button.

No external PDF library. Zero dependencies.

## Form Layout

Side-by-side on desktop: form sidebar (420px, scrollable, sticky) on the left, slip preview on the right. At widths ≤960px, stack vertically.

Form sections:

1. Toolbar — Auto-fill (opens modal) + Reset buttons
2. Hotel details (name, address, phone, GPS, logo upload)
3. Booking confirmation (confirmation #, PIN)
4. Stay details (check-in date/time, check-out date/time)
5. Guests & rooms (room count, dynamic guest names with Add/Remove)
6. Price (currency select, total amount)
7. Aggregator details (name, phone, website, logo upload)
8. Download PDF button

Logo upload: FileReader → canvas resize (max 200px) → PNG data URL (preserves transparency). SVG files bypass canvas and are stored as raw SVG data URLs.

## localStorage

- Key: `hotel-reservation-booking`
- Stored as JSON
- Debounced auto-save on every form change (300ms)
- Auto-restore on page mount
- Corrupt/invalid data resets to defaults silently
- No expiration

## JSON Import / LLM Prompt

- Same modal pattern as airline-print.
- JSON schema matches the Data Model above.
- LLM prompt instructs extraction from hotel booking confirmations (Booking.com, Agoda, etc.).

## In Scope

- Single booking at a time
- Client-side only (no server, no API)
- One hotel per slip
- Live preview updates
- Print-friendly PDF via browser
- localStorage persistence
- Empty field omission
- Responsive layout (desktop first, mobile stacks)
- JSON import / upload
- Reset to defaults
- LLM extraction prompt helper

## Out of Scope (v1)

- Per-room details (room type, bed preference, per-room price). Only the room **count** is captured.
- Price breakdown (tax, service charge, subtotal). Single total only.
- Special requests, cancellation policy, hotel amenities, payment methods, support contact info.
- Map embed.
- QR codes, "load sample data" button, saved-slip history.
- Multi-document management.
- Backend / accounts / sync.
- Repeating print header/footer on multi-page output.
- Image size rejection (auto-compress instead).
- Separate "Number of guests" field (derived from name list).
