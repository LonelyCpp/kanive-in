# Context — ananthu-portfolio

## Airline Print

| Term                     | Definition                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Booking**              | A single flight reservation from an aggregator. Contains passengers, flights, airline info, aggregator info, and total cost. One booking at a time.                         |
| **Passenger**            | A person traveling. Has a name, type (Adult/Child/Infant), and one e-Ticket number covering all flights.                                                                    |
| **e-Ticket number**      | Per-passenger document identifier. Shown next to the passenger on every flight.                                                                                             |
| **Flight**               | A travel segment (origin → destination) with flight number, date, departure/arrival times, duration, terminal, and class. Belongs to either the Outbound or Return section. |
| **Seat number**          | Per passenger × per flight. Assigned seat on a specific flight segment.                                                                                                     |
| **Outbound**             | One-way or outward journey. Contains 1+ flight segments.                                                                                                                    |
| **Return**               | Journey back. Contains 1+ flight segments. Optional — omitted if none.                                                                                                      |
| **Aggregator**           | The booking platform (e.g., MakeMyTrip, Expedia). Has name, logo, and structured contact (phone, email, website, address).                                                  |
| **Airline**              | The carrier operating all flights in the booking. Has name, logo, and structured contact. One airline per booking.                                                          |
| **PNR**                  | Passenger Name Record — the booking reference code from the airline/aggregator.                                                                                             |
| **Booking ID**           | A separate booking identifier provided by the aggregator.                                                                                                                   |
| **Ticket preview**       | The live, editorial-style rendered ticket shown alongside the form.                                                                                                         |
| **Download PDF**         | Opens the browser's native print dialog (Save as PDF). Uses `@media print` CSS.                                                                                             |
| **Empty-field omission** | Any form field left blank causes its corresponding element to be removed from the ticket preview. No validation, no errors.                                                 |
