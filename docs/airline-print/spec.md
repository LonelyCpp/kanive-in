# Airline Print — Spec

Generates beautiful, formal, print-friendly flight reservation tickets from user-provided details.

## Scope

A single-page tool at `/tools/airline-print` that:

1. Collects booking details via a form sidebar
2. Renders a live editorial ticket preview
3. Produces a print-friendly PDF via the browser's native print dialog

## User Flow

1. User navigates to `/tools/airline-print`
2. If saved data exists in localStorage, form auto-fills with last booking
3. If no saved data: form starts with **1 passenger, 1 outbound flight, 0 return flights**
4. User fills in form fields; ticket preview updates live on the right
5. Optional: User clicks **Auto-fill** to open a modal. They can paste JSON directly, or copy the LLM prompt, paste it with their booking confirmation into any LLM, then paste the resulting JSON back into the modal and click Import
6. User clicks **Download PDF** → browser print dialog opens (save as PDF)
7. Every time the form changes, data is saved to localStorage
8. User clicks **Reset** to clear everything and start fresh

## Data Model

### Booking

| Field                 | Type                          | Notes                        |
| --------------------- | ----------------------------- | ---------------------------- |
| Booking ID            | string                        | free text                    |
| PNR                   | string                        | free text                    |
| Total cost (currency) | select                        | INR, USD, EUR, GBP, AED, SGD |
| Total cost (amount)   | number                        | numeric                      |
| Airline name          | string                        |                              |
| Airline logo          | image (FileReader → data URL) | compressed ≤200px, PNG       |
| Airline phone         | string                        |                              |
| Airline email         | string                        |                              |
| Airline website       | string                        |                              |
| Airline address       | string                        |                              |
| Aggregator name       | string                        |                              |
| Aggregator logo       | image (FileReader → data URL) | compressed ≤200px, PNG       |
| Aggregator phone      | string                        |                              |
| Aggregator email      | string                        |                              |
| Aggregator website    | string                        |                              |
| Aggregator address    | string                        |                              |

### Passenger (per booking, list)

| Field           | Type   | Notes                                 |
| --------------- | ------ | ------------------------------------- |
| Name            | string |                                       |
| Type            | select | Adult / Child / Infant                |
| e-Ticket number | string | one per passenger, covers all flights |

### Flight (list, grouped as Outbound / Return)

| Field                | Type   | Notes                                           |
| -------------------- | ------ | ----------------------------------------------- |
| Flight number        | string | e.g. 6E-123                                     |
| Origin               | string | city/airport name                               |
| Origin code          | string | IATA code, e.g. BLR                             |
| Destination          | string | city/airport name                               |
| Destination code     | string | IATA code, e.g. DEL                             |
| Date                 | date   | departure date                                  |
| Arrival date         | date   | optional; falls back to departure date if blank |
| Departure time       | time   | 24-hour                                         |
| Arrival time         | time   | 24-hour, independent of duration                |
| Duration             | string | free text, e.g. "2h 30m"                        |
| Origin terminal      | string | e.g. T1                                         |
| Destination terminal | string | e.g. T3                                         |
| Class                | string | free text, e.g. Economy                         |

### Seat number (per passenger × flight)

| Field | Type   | Notes                 |
| ----- | ------ | --------------------- |
| Seat  | string | free text, e.g. "12A" |

## Relationships

```
Booking
  ├── Passengers[]         (min 1 default, can be 0)
  │     ├── e-Ticket number (global, shown per flight)
  │     └── Seats[]         (per flight)
  ├── Outbound Flights[]    (min 1 default, can be 0)
  └── Return Flights[]      (min 0 default, can be 0)
```

## "Empty field → remove element" Rule

Any field left blank in the form is omitted from the ticket preview. No validation errors. Examples:

- No return flights → Return section not shown
- Passenger name blank → that passenger not listed
- Terminal blank → omitted from code line
- No logo uploaded → logo element not shown
- e-Ticket number blank → not shown

---

## Ticket Visual Design

### Typography

Three-typeface system loaded from Google Fonts (`<link>` in `<svelte:head>`):

| Typeface             | Usage                                                      | Weights       |
| -------------------- | ---------------------------------------------------------- | ------------- |
| **Playfair Display** | Masthead, city names, total fare                           | 600, 700      |
| **Inter**            | Body copy, labels, passenger names, contacts               | 400, 500, 600 |
| **JetBrains Mono**   | PNR, Booking ID, flight number, e-ticket, seat, IATA codes | 400, 500      |

Hierarchy is built through font + weight + size, not color:

- `.label` — 10px, uppercase, 0.18em letter-spacing, muted ink. Used for every field caption.
- `.value` — 14px semibold, dark ink. Normal data.
- `.value-lg` — 24px Playfair Display. For hero data (city names, total fare).
- `.value-mono` — 13px JetBrains Mono. For all machine-readable codes.

### Color Palette

CSS custom properties scoped to `.ticket`:

| Variable       | Value              | Usage                         |
| -------------- | ------------------ | ----------------------------- |
| `--paper`      | `hsl(36 30% 96%)`  | Ticket background             |
| `--ink`        | `hsl(220 45% 12%)` | Primary text (deep navy)      |
| `--ink-soft`   | `hsl(220 20% 38%)` | Secondary text                |
| `--ink-muted`  | `hsl(220 15% 60%)` | Captions, fine print          |
| `--accent`     | `hsl(30 55% 45%)`  | Brass/ochre — plane icon only |
| `--paper-edge` | `hsl(36 15% 85%)`  | Borders, dotted lines         |

### Surface

- Warm off-white background (`--paper`) with a subtle 18px dot grid (`radial-gradient`) — tactile paper feel.
- Thin `--paper-edge` border, soft layered shadow.

### Dividers

- `.ticket-perf` — `2px dotted` line (`--paper-edge`) used between all major sections. Mimics tear-off perforation.
- No solid borders between sections — only dotted perforation lines.

### Icons

From `@iconify/svelte` (`mdi:` Material Design Icons), wrapped in `<span>` for scoped CSS:

| Icon                              | Placement                              |
| --------------------------------- | -------------------------------------- |
| `mdi:airplane`                    | Center of each flight segment route    |
| `mdi:ticket-confirmation-outline` | Top-right, next to PNR / Booking ID    |
| `mdi:seat-passenger`              | Next to seat assignments in passengers |

---

## Ticket Section Layout

### Section order

1. **Masthead** — "E-Ticket Itinerary" in Playfair Display, centered
2. **Perforation**
3. **Top section** — 2-column grid: airline (logo, name, contact) on left, PNR + Booking ID on right
4. **Perforation**
5. **Outbound** — flight segments (3-column grid, see below)
6. **Perforation**
7. **Return** — same as Outbound. Omitted if no return flights.
8. **Perforation**
9. **Passengers** — each passenger: name (left), e-Ticket (right-aligned). Seats below with icon.
10. **Perforation**
11. **Total Fare** — label left, amount right in Playfair
12. **Perforation**
13. **Issuer footer** — "Issued by [logo] Aggregator · contact · Generated by Airline Print" — single compact centered row
14. **Fallback footer** — standalone "Generated by Airline Print" when no aggregator

### Flight segment: 3-column grid

Each flight segment is a `grid-template-columns: 1fr auto 1fr`:

| Left column (departure)     | Center (flight info)   | Right column (arrival)       |
| --------------------------- | ---------------------- | ---------------------------- |
| `label`: "From"             | Plane icon w/ dashes   | `label`: "To"                |
| `value-lg`: origin city     | `segment-duration`     | `value-lg`: destination city |
| `value-mono`: ORIG \| T1    | `value-mono`: flight # | `value-mono`: DEST \| T2     |
| `segment-time-value`: 14:30 | `segment-class`        | `segment-time-value`: 16:30  |
| `segment-time-date`: date   |                        | `segment-time-date`: date    |

- Airport codes and terminals displayed inline as `BLR | T2`.
- Plane icon centered with short dashed lines (40px) on each side via `::before`/`::after` pseudo-elements.
- Time values are 20px bold. Dates are 12px.

### Passenger section

- `.passenger-main` — flex row with `justify-content: space-between`. Name + type on left, e-Ticket number right-aligned.
- `.passenger-seats` — below name: seat icon + seat badges showing `12A (BLR→DEL)`.

### Total Fare

- Flex row, `space-between`. "Total Fare" label left, amount right in Playfair Display (26px).

### Issuer footer

- Single centered flex row. "Issued by" label → optional logo → aggregator name → contact (inline). Ends with "Generated by Airline Print".

## Print / PDF

- CSS `@media print` hides form sidebar, navbar, and all interactive elements.
- Only the ticket preview is printed.
- Page size: A4 portrait, 10mm margins.
- Background becomes pure white (`#fff`). Dot grid hidden. Shadows hidden.
- Solid 1px black border around ticket card.
- Dotted perforation lines preserved (only color changes to `#999`).
- Labels become `#444`. Ink becomes `#000`.
- `window.print()` via "Download PDF" button.

No external PDF library. Zero dependencies.

## Form Layout

Side-by-side on desktop: form sidebar (420px, scrollable, sticky) on the left, ticket preview on the right. At widths ≤960px, stack vertically.

Form sections:

1. Toolbar — Auto-fill (opens modal) + Reset buttons
2. Booking details
3. Airline details (name, logo upload, contact)
4. Aggregator details (name, logo upload, contact)
5. Passengers with Add/Remove
6. Outbound flights with Add/Remove (includes seat inputs per passenger)
7. Return flights with Add/Remove
8. Total cost
9. Download PDF button

Logo upload: FileReader → canvas resize (max 200px) → PNG data URL (preserves transparency). SVG files bypass canvas and are stored as raw SVG data URLs.

## localStorage

- Key: `airline-print-booking`
- Stored as JSON
- Debounced auto-save on every form change (300ms)
- Auto-restore on page mount
- Corrupt/invalid data resets to defaults silently
- No expiration

## In Scope

- Single booking at a time
- Client-side only (no server, no API)
- One airline per booking
- Outbound + Return flight grouping
- Live preview updates
- Print-friendly PDF via browser
- localStorage persistence
- Empty field omission
- Responsive layout (desktop first, mobile stacks)
- JSON import / upload
- Reset to defaults
- LLM extraction prompt helper

## Out of Scope

- Multiple saved bookings / booking library
- Barcodes, QR codes, or any scannable elements
- Server-side PDF generation
- Multi-airline bookings
- Baggage details
- Gate info
- Actual PDF blob download (uses browser print dialog)
- Dark mode for the ticket preview
- i18n / translations
- Boarding pass generation
