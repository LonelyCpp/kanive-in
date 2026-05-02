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
5. User clicks **Download PDF** → browser print dialog opens (save as PDF)
6. Every time the form changes, data is saved to localStorage

## Data Model

### Booking

| Field                 | Type                          | Notes                        |
| --------------------- | ----------------------------- | ---------------------------- |
| Booking ID            | string                        | free text                    |
| PNR                   | string                        | free text                    |
| Total cost (currency) | select                        | INR, USD, EUR, GBP, AED, SGD |
| Total cost (amount)   | number                        | numeric                      |
| Airline name          | string                        |                              |
| Airline logo          | image (FileReader → data URL) | compressed to ≤200×200px     |
| Airline phone         | string                        |                              |
| Airline email         | string                        |                              |
| Airline website       | string                        |                              |
| Airline address       | string                        |                              |
| Aggregator name       | string                        |                              |
| Aggregator logo       | image (FileReader → data URL) | compressed to ≤200×200px     |
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

| Field          | Type   | Notes                              |
| -------------- | ------ | ---------------------------------- |
| Flight number  | string | e.g. 6E-123                        |
| Origin         | string | airport/city                       |
| Destination    | string | airport/city                       |
| Date           | date   |                                    |
| Departure time | time   | 24-hour                            |
| Arrival time   | time   | 24-hour, independent of duration   |
| Duration       | string | free text, e.g. "2h 30m"           |
| Terminal       | string |                                    |
| Class          | string | free text, e.g. Economy / Business |

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

Any field left blank in the form is omitted from the ticket preview. Examples:

- No return flights → Return section not shown
- Passenger name blank → that passenger not listed
- Terminal blank → terminal not shown for that flight
- No logo uploaded → logo element not shown
- e-Ticket number blank → not shown

## Ticket Preview Layout

Minimal typographic style: strong heading hierarchy, serif headers, ample whitespace, thin horizontal rules as dividers. Light/cream background with dark text (print-optimized).

**Section order:**

1. **Header** — Airline logo (left), Airline name (right), thin rule below
2. **Reference line** — Booking ID | PNR (compact, light rule below)
3. **Outbound** — Section heading. Each flight as a block: Flight number, Origin → Destination, Date, Departure → Arrival, Duration, Terminal, Class. Thin rule between flights.
4. **Return** — Same format as Outbound. Omitted if no return flights.
5. **Passengers** — Section heading. Per passenger: Name (Type), e-Ticket number. Below: compact seat table showing each flight and seat.
6. **Aggregator** — Aggregator logo, name, contact details in compact format.
7. **Total** — Total cost, right-aligned, prominent.
8. **Footer** — Light rule, subtle "Generated by Airline Print" mark.

## Form Layout

Side-by-side on desktop (form left, preview right). Form is scrollable independently. At widths ≤720px, stack vertically (form above, preview below).

Form sections:

1. Booking details
2. Airline details (with logo upload)
3. Aggregator details (with logo upload)
4. Passengers (with Add/Remove)
5. Outbound flights (with Add/Remove)
6. Return flights (with Add/Remove)
7. Total cost
8. Download PDF button

## Print / PDF

- CSS `@media print` hides the entire form sidebar, navbar, and all interactive elements
- Only the ticket preview is printed
- Page size: A4 portrait (fits Letter too)
- Margins: 12mm all sides
- Background colors and shadows suppressed
- Ticket fills the printed page cleanly
- "Download PDF" button triggers `window.print()`

No external PDF library. Zero dependencies.

## localStorage

- Key: `airline-print-booking`
- Stored as JSON
- Save on every form change (debounced to avoid excessive writes)
- Auto-restore on page mount (`onMount`)
- If stored data is corrupt/invalid, reset to defaults silently
- No expiration (unlike photo-selector's 24h TTL — user explicitly saves their booking)

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

## Out of Scope

- Multiple saved bookings / booking library
- Barcodes, QR codes, or any scannable elements
- Server-side PDF generation
- Multi-airline bookings
- Baggage details
- Gate info
- Cabin bag / check-in bag breakdown
- Actual PDF blob download (uses browser print dialog)
- Dark mode for the ticket preview (ticket is always light/print)
- i18n / translations
- Boarding pass generation (this is a reservation ticket, not a boarding pass)
