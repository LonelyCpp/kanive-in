# Hotel reservation slip — spec

## Goal

Generate a clean, minimal, A4-printable summary of a hotel booking from user-entered details.

## User flow

1. Landing (`/`) → user picks "Hotel reservation slip".
2. Form (`/hotel-reservation`) → user enters booking details. Inputs auto-save to `localStorage` on every change.
3. Preview (`/hotel-reservation/preview`) → renders a printable slip. A "Print" button opens the browser print dialog.
4. If the user opens preview without saved data, redirect back to the form.

## Fields captured

### Hotel

- Hotel name _(required)_
- Address _(required, multiline)_
- Phone
- GPS coordinates
- Hotel logo (image upload, optional)

### Booking confirmation

Grouped together so the PIN is unambiguously the booking PIN, not a postal/area pincode.

- Confirmation number _(required)_
- Booking PIN

### Stay

- Check-in date _(required)_ + time
- Check-out date _(required)_ + time
- Nights — derived from dates, not entered

### Guests & rooms

- Number of rooms
- Number of guests
- Guest names — dynamic list, add/remove

### Price

- Currency (single, e.g. "SGD")
- Total price (single value, no breakdown)

### Booked via (optional)

The platform the booking was made through (e.g. Booking.com, Agoda).

- Aggregator name
- Aggregator phone
- Aggregator website
- Aggregator logo (image upload)

## Out of scope (v1)

- Per-room details (room type, bed preference, per-room price). Only the room **count** is captured.
- Price breakdown (tax, service charge, subtotal). Single total only.
- Special requests, cancellation policy, hotel amenities, payment methods, support contact info.
- Map embed.
- QR codes, "load sample data" button, saved-slip history.
- Multi-document management.
- Backend / accounts / sync.

## Image upload

- Logos are uploaded as image files and stored as base64 data URLs in `localStorage`.
- Max 500 KB per image. Larger uploads are rejected with an inline error.
- Accepts any browser-supported `image/*` MIME type (PNG, JPG, SVG, WebP).

## Print requirements

- Output fits A4 portrait.
- Content gracefully breaks across pages when it overflows.
- Print header and footer (hotel name + confirmation #) repeat on every printed page.
- Guest list and total block must not split mid-element.
- Form chrome (Print button, "Edit details" link) is hidden during print.

## Visual direction

Follow the visual design used in the airline-print feature.
