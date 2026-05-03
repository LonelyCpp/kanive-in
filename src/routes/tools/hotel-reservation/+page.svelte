<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	const LOCAL_STORAGE_KEY = 'hotel-reservation-booking';
	const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

	const LLM_PROMPT = `You are a data extraction assistant. I will provide a hotel booking confirmation (as text or an image). Extract all available details and output them as a single JSON object in the following exact structure. Use empty strings for missing fields. Do not include markdown code blocks around the JSON.

{
  "hotel": {
    "name": "",
    "address": "",
    "phone": "",
    "gps": "",
    "logo": ""
  },
  "confirmation": {
    "number": "",
    "pin": ""
  },
  "stay": {
    "checkInDate": "",
    "checkInTime": "",
    "checkOutDate": "",
    "checkOutTime": ""
  },
  "guests": {
    "roomCount": 1,
    "names": [
      { "name": "", "bookedUnder": false }
    ]
  },
  "price": {
    "currency": "INR",
    "total": ""
  },
  "aggregator": {
    "name": "",
    "phone": "",
    "website": "",
    "logo": ""
  }
}

Rules:
- currency must be one of: INR, USD, EUR, GBP, AED, SGD
- checkInDate, checkOutDate must be in YYYY-MM-DD format
- checkInTime, checkOutTime must be in 24-hour HH:MM format
- roomCount must be a number (default 1)
- names is an array of objects with "name" (string) and "bookedUnder" (boolean)
- Exactly one guest should have bookedUnder set to true (the primary guest who made the reservation). If unknown, set the first guest to true.
- Do not hallucinate data. If a field is not present in the source, use an empty string.`;

	interface Hotel {
		name: string;
		address: string;
		phone: string;
		gps: string;
		logo: string;
	}

	interface Confirmation {
		number: string;
		pin: string;
	}

	interface Stay {
		checkInDate: string;
		checkInTime: string;
		checkOutDate: string;
		checkOutTime: string;
	}

	interface Guest {
		name: string;
		bookedUnder: boolean;
	}

	interface Guests {
		roomCount: number;
		names: Guest[];
	}

	interface Price {
		currency: string;
		total: string;
	}

	interface Aggregator {
		name: string;
		phone: string;
		website: string;
		logo: string;
	}

	interface Booking {
		hotel: Hotel;
		confirmation: Confirmation;
		stay: Stay;
		guests: Guests;
		price: Price;
		aggregator: Aggregator;
	}

	function createEmptyBooking(): Booking {
		return {
			hotel: { name: '', address: '', phone: '', gps: '', logo: '' },
			confirmation: { number: '', pin: '' },
			stay: { checkInDate: '', checkInTime: '', checkOutDate: '', checkOutTime: '' },
			guests: { roomCount: 1, names: [{ name: '', bookedUnder: true }] },
			price: { currency: 'INR', total: '' },
			aggregator: { name: '', phone: '', website: '', logo: '' }
		};
	}

	let booking: Booking = $state(createEmptyBooking());

	let mounted = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout>;
	let showModal = $state(false);
	let jsonInput = $state('');
	let promptCopied = $state(false);

	function addGuest() {
		booking.guests.names.push({ name: '', bookedUnder: false });
		scheduleSave();
	}

	function removeGuest(index: number) {
		const wasBookedUnder = booking.guests.names[index]?.bookedUnder;
		booking.guests.names.splice(index, 1);
		if (booking.guests.names.length === 0) {
			booking.guests.names.push({ name: '', bookedUnder: true });
		} else if (wasBookedUnder) {
			booking.guests.names[0].bookedUnder = true;
		}
		scheduleSave();
	}

	function setBookedUnder(index: number) {
		booking.guests.names.forEach((g, i) => {
			g.bookedUnder = i === index;
		});
		scheduleSave();
	}

	async function handleLogoUpload(event: Event, target: 'hotel' | 'aggregator'): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const dataUrl = await compressImage(file);
			booking[target].logo = dataUrl;
			scheduleSave();
		} catch {
			// silently ignore compression failures
		}
	}

	function compressImage(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			if (file.type === 'image/svg+xml') {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = () => reject(new Error('Failed to read SVG'));
				reader.readAsDataURL(file);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const img = new Image();
				img.onload = () => {
					const MAX_SIZE = 200;
					let { width, height } = img;
					if (width > height) {
						if (width > MAX_SIZE) {
							height *= MAX_SIZE / width;
							width = MAX_SIZE;
						}
					} else {
						if (height > MAX_SIZE) {
							width *= MAX_SIZE / height;
							height = MAX_SIZE;
						}
					}
					const canvas = document.createElement('canvas');
					canvas.width = Math.round(width);
					canvas.height = Math.round(height);
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Could not get canvas context'));
						return;
					}
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					resolve(canvas.toDataURL('image/png'));
				};
				img.onerror = () => reject(new Error('Failed to load image'));
				img.src = reader.result as string;
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	function saveToLocalStorage() {
		try {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(booking));
		} catch {
			// localStorage full or unavailable
		}
	}

	function loadFromLocalStorage(): Booking | null {
		try {
			const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				// Migrate old string-array names to Guest objects
				if (parsed?.guests?.names && Array.isArray(parsed.guests.names)) {
					const first = parsed.guests.names[0];
					if (typeof first === 'string') {
						parsed.guests.names = parsed.guests.names.map((n: string, i: number) => ({
							name: n,
							bookedUnder: i === 0
						}));
					}
				}
				return parsed as Booking;
			}
		} catch {
			// corrupt data, ignore
		}
		return null;
	}

	function scheduleSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveToLocalStorage, 300);
	}

	function printTicket() {
		window.print();
	}

	function resetBooking() {
		if (!confirm('Clear all details and start fresh?')) return;
		booking = createEmptyBooking();
		saveToLocalStorage();
	}

	function importJson(): void {
		if (!jsonInput.trim()) return;
		try {
			const parsed = JSON.parse(jsonInput);
			if (parsed && typeof parsed === 'object' && parsed.hotel && parsed.stay && parsed.guests) {
				booking = parsed as Booking;
				saveToLocalStorage();
				jsonInput = '';
				showModal = false;
			} else {
				alert('Invalid JSON format. Expected a hotel booking object.');
			}
		} catch {
			alert('Could not parse the JSON. Check for syntax errors.');
		}
	}

	async function copyPrompt() {
		try {
			await navigator.clipboard.writeText(LLM_PROMPT);
			promptCopied = true;
			setTimeout(() => (promptCopied = false), 2000);
		} catch {
			// silently ignore copy failures
		}
	}

	onMount(() => {
		const saved = loadFromLocalStorage();
		if (saved) {
			booking = saved;
		}
		mounted = true;
	});

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr + 'T00:00:00');
			return d.toLocaleDateString('en-IN', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	function formatTime(timeStr: string): string {
		return timeStr || '';
	}

	function isNonEmpty(val: string): boolean {
		return val.trim().length > 0;
	}

	function computeNights(): number {
		const inDate = booking.stay.checkInDate;
		const outDate = booking.stay.checkOutDate;
		if (!inDate || !outDate) return 0;
		try {
			const start = new Date(inDate + 'T00:00:00').getTime();
			const end = new Date(outDate + 'T00:00:00').getTime();
			const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
			return Math.max(0, diff);
		} catch {
			return 0;
		}
	}

	const nights = $derived(computeNights());
	const guestCount = $derived(booking.guests.names.filter((g) => isNonEmpty(g.name)).length);
</script>

<svelte:head>
	<title>Hotel Reservation — Tools</title>
	<meta name="description" content="Generate beautiful, print-friendly hotel reservation slips" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-layout">
	<div class="form-sidebar" oninput={scheduleSave}>
		<h2>Booking Details</h2>

		<div class="form-toolbar">
			<button type="button" class="btn-secondary" onclick={() => (showModal = true)}>
				Auto-fill
			</button>
			<button type="button" class="btn-secondary" onclick={resetBooking}>Reset</button>
		</div>

		<section class="form-section">
			<h3>Hotel</h3>
			<label>
				<span class="label-text">Name</span>
				<input
					type="text"
					bind:value={booking.hotel.name}
					placeholder="e.g. The Taj Mahal Palace"
				/>
			</label>
			<label>
				<span class="label-text">Address</span>
				<textarea bind:value={booking.hotel.address} placeholder="Full address" rows={3}></textarea>
			</label>
			<label>
				<span class="label-text">Phone</span>
				<input type="text" bind:value={booking.hotel.phone} placeholder="+91-" />
			</label>
			<label>
				<span class="label-text">GPS Coordinates</span>
				<input
					type="text"
					bind:value={booking.hotel.gps}
					placeholder="e.g. 18.9217° N, 72.8332° E"
				/>
			</label>
			<label>
				<span class="label-text">Logo</span>
				<input type="file" accept="image/*" onchange={(e) => handleLogoUpload(e, 'hotel')} />
				{#if booking.hotel.logo}
					<div class="logo-preview">
						<img src={booking.hotel.logo} alt="Hotel logo" />
						<button
							type="button"
							class="btn-remove-text"
							onclick={() => {
								booking.hotel.logo = '';
								scheduleSave();
							}}
						>
							Remove
						</button>
					</div>
				{/if}
			</label>
		</section>

		<section class="form-section">
			<h3>Booking Confirmation</h3>
			<label>
				<span class="label-text">Confirmation Number</span>
				<input type="text" bind:value={booking.confirmation.number} placeholder="e.g. 12345678" />
			</label>
			<label>
				<span class="label-text">Booking PIN</span>
				<input type="text" bind:value={booking.confirmation.pin} placeholder="e.g. 4821" />
			</label>
		</section>

		<section class="form-section">
			<h3>Stay</h3>
			<div class="input-row">
				<label>
					<span class="label-text">Check-in Date</span>
					<input type="date" bind:value={booking.stay.checkInDate} />
				</label>
				<label>
					<span class="label-text">Check-in Time</span>
					<input type="time" bind:value={booking.stay.checkInTime} />
				</label>
			</div>
			<div class="input-row">
				<label>
					<span class="label-text">Check-out Date</span>
					<input type="date" bind:value={booking.stay.checkOutDate} />
				</label>
				<label>
					<span class="label-text">Check-out Time</span>
					<input type="time" bind:value={booking.stay.checkOutTime} />
				</label>
			</div>
		</section>

		<section class="form-section">
			<h3>Guests & Rooms</h3>
			<label>
				<span class="label-text">Number of Rooms</span>
				<input type="number" min="1" bind:value={booking.guests.roomCount} />
			</label>
			{#each booking.guests.names as guest, i}
				<div class="item-block">
					<div class="item-block-header">
						<span>Guest {i + 1}</span>
						<button type="button" class="btn-remove" onclick={() => removeGuest(i)}>
							&times;
						</button>
					</div>
					<label>
						<span class="label-text">Name</span>
						<input type="text" bind:value={guest.name} placeholder="Full name" />
					</label>
					<label class="booked-under-label">
						<input type="checkbox" checked={guest.bookedUnder} onchange={() => setBookedUnder(i)} />
						<span class="label-text">Booked under this name</span>
					</label>
				</div>
			{/each}
			<button type="button" class="btn-add" onclick={addGuest}> + Add Guest </button>
		</section>

		<section class="form-section">
			<h3>Price</h3>
			<div class="input-row">
				<label>
					<span class="label-text">Currency</span>
					<select bind:value={booking.price.currency}>
						{#each CURRENCIES as cur}
							<option value={cur}>{cur}</option>
						{/each}
					</select>
				</label>
				<label>
					<span class="label-text">Total Price</span>
					<input type="text" bind:value={booking.price.total} placeholder="12,500" />
				</label>
			</div>
		</section>

		<section class="form-section">
			<h3>Booked Via</h3>
			<label>
				<span class="label-text">Aggregator Name</span>
				<input type="text" bind:value={booking.aggregator.name} placeholder="e.g. Booking.com" />
			</label>
			<label>
				<span class="label-text">Logo</span>
				<input type="file" accept="image/*" onchange={(e) => handleLogoUpload(e, 'aggregator')} />
				{#if booking.aggregator.logo}
					<div class="logo-preview">
						<img src={booking.aggregator.logo} alt="Aggregator logo" />
						<button
							type="button"
							class="btn-remove-text"
							onclick={() => {
								booking.aggregator.logo = '';
								scheduleSave();
							}}
						>
							Remove
						</button>
					</div>
				{/if}
			</label>
			<label>
				<span class="label-text">Phone</span>
				<input type="text" bind:value={booking.aggregator.phone} placeholder="+91-" />
			</label>
			<label>
				<span class="label-text">Website</span>
				<input type="text" bind:value={booking.aggregator.website} placeholder="booking.com" />
			</label>
		</section>

		{#if showModal}
			<div
				class="modal-backdrop"
				role="presentation"
				onclick={(e) => {
					if (e.target === e.currentTarget) showModal = false;
				}}
			>
				<div class="modal-card">
					<div class="modal-header">
						<h3>Auto-fill Booking</h3>
						<button type="button" class="btn-remove" onclick={() => (showModal = false)}
							>&times;</button
						>
					</div>

					<section class="modal-section">
						<p class="helper-text">
							Paste JSON extracted from your booking confirmation below, then click Import.
						</p>
						<textarea
							class="prompt-textarea"
							bind:value={jsonInput}
							placeholder="Paste JSON here..."
							rows={8}
						></textarea>
						<button type="button" class="btn-secondary btn-copy" onclick={importJson}>
							Import JSON
						</button>
					</section>

					<div class="modal-divider"></div>

					<section class="modal-section">
						<p class="helper-text">
							No JSON yet? Copy the prompt below and paste it into any LLM along with your booking
							confirmation. Save the JSON reply, then paste it above.
						</p>
						<textarea class="prompt-textarea" readonly value={LLM_PROMPT} rows={10}></textarea>
						<button type="button" class="btn-secondary btn-copy" onclick={copyPrompt}>
							{promptCopied ? 'Copied!' : 'Copy Prompt'}
						</button>
					</section>
				</div>
			</div>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn-print" onclick={printTicket}> Download PDF </button>
		</div>
	</div>

	<div class="preview-panel">
		<div class="ticket">
			<h1 class="ticket-masthead">Hotel Reservation</h1>

			<div class="ticket-perf"></div>

			{#if isNonEmpty(booking.hotel.name) || booking.hotel.logo || isNonEmpty(booking.hotel.phone)}
				<div class="ticket-top">
					<div class="ticket-top-left">
						{#if isNonEmpty(booking.hotel.name)}
							<h2 class="ticket-hotel-name">{booking.hotel.name}</h2>
						{/if}
						{#if isNonEmpty(booking.hotel.phone)}
							<div class="ticket-hotel-phone">{booking.hotel.phone}</div>
						{/if}
					</div>
					{#if booking.hotel.logo}
						<div class="ticket-top-right">
							<img
								class="ticket-hotel-logo"
								src={booking.hotel.logo}
								alt={booking.hotel.name || 'Hotel'}
							/>
						</div>
					{/if}
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if isNonEmpty(booking.confirmation.number) || isNonEmpty(booking.confirmation.pin) || isNonEmpty(booking.hotel.address) || isNonEmpty(booking.hotel.gps)}
				<div class="ticket-confirmation">
					<div class="ticket-confirmation-left">
						{#if isNonEmpty(booking.hotel.address)}
							<div class="ticket-hotel-address">{booking.hotel.address}</div>
						{/if}
						{#if isNonEmpty(booking.hotel.gps)}
							<div class="ticket-hotel-gps">{booking.hotel.gps}</div>
						{/if}
					</div>
					<div class="ticket-confirmation-right">
						{#if isNonEmpty(booking.confirmation.number)}
							<div class="ticket-ref-item">
								<span class="label">Confirmation #</span>
								<span class="value-mono">{booking.confirmation.number}</span>
							</div>
						{/if}
						{#if isNonEmpty(booking.confirmation.pin)}
							<div class="ticket-ref-item">
								<span class="label">PIN</span>
								<span class="value-mono">{booking.confirmation.pin}</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if isNonEmpty(booking.stay.checkInDate) || isNonEmpty(booking.stay.checkOutDate)}
				<div class="ticket-stay">
					<div class="stay-grid">
						<div class="stay-col">
							<span class="label">Check-in</span>
							{#if isNonEmpty(booking.stay.checkInDate)}
								<span class="value-lg">{formatDate(booking.stay.checkInDate)}</span>
							{/if}
							{#if isNonEmpty(booking.stay.checkInTime)}
								<span class="value-mono">{formatTime(booking.stay.checkInTime)}</span>
							{/if}
						</div>

						<div class="stay-col stay-col--center">
							<div class="stay-icon-line">
								<span class="bed-icon"><Icon icon="mdi:bed" /></span>
							</div>
							{#if nights > 0}
								<span class="stay-nights">{nights} night{nights > 1 ? 's' : ''}</span>
							{/if}
						</div>

						<div class="stay-col stay-col--right">
							<span class="label">Check-out</span>
							{#if isNonEmpty(booking.stay.checkOutDate)}
								<span class="value-lg">{formatDate(booking.stay.checkOutDate)}</span>
							{/if}
							{#if isNonEmpty(booking.stay.checkOutTime)}
								<span class="value-mono">{formatTime(booking.stay.checkOutTime)}</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if guestCount > 0 || booking.guests.roomCount > 0}
				<div class="ticket-guests">
					<h2 class="ticket-section-title">Guests</h2>
					<div class="guests-summary">
						{booking.guests.roomCount} room{booking.guests.roomCount > 1 ? 's' : ''}
						&nbsp;&middot;&nbsp;
						{guestCount} guest{guestCount > 1 ? 's' : ''}
					</div>
					{#each booking.guests.names.toSorted((a, b) => Number(b.bookedUnder) - Number(a.bookedUnder)) as guest}
						{#if isNonEmpty(guest.name)}
							<div class="ticket-guest-name">
								<span class="value">{guest.name}</span>
								{#if guest.bookedUnder}
									<span class="booked-under-badge">Booked under</span>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if isNonEmpty(booking.price.total)}
				<div class="ticket-total">
					<span class="ticket-total-label">Total</span>
					<span class="ticket-total-value value-lg"
						>{booking.price.currency === 'INR' ? '₹' : booking.price.currency + ' '}
						{booking.price.total}</span
					>
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if isNonEmpty(booking.aggregator.name)}
				<div class="ticket-issuer">
					<span class="label">Booked via</span>
					{#if booking.aggregator.logo}
						<img
							class="ticket-issuer-logo"
							src={booking.aggregator.logo}
							alt={booking.aggregator.name}
						/>
					{/if}
					<span class="value">{booking.aggregator.name}</span>
					{#if isNonEmpty(booking.aggregator.phone) || isNonEmpty(booking.aggregator.website)}
						<span class="ticket-issuer-contact">
							{#if isNonEmpty(booking.aggregator.phone)}<span>{booking.aggregator.phone}</span>{/if}
							{#if isNonEmpty(booking.aggregator.website)}<span>{booking.aggregator.website}</span
								>{/if}
						</span>
					{/if}
					<span class="ticket-footer-text">Generated by Hotel Reservation Print</span>
				</div>
			{:else}
				<div class="ticket-footer">Generated by Hotel Reservation Print</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.app-layout {
		display: grid;
		grid-template-columns: 420px 1fr;
		gap: 32px;
		align-items: start;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		min-height: calc(100vh - 60px);
		padding: 24px 0;
	}

	/* ── Form Sidebar ── */

	.form-sidebar {
		overflow-y: auto;
		max-height: calc(100vh - 108px);
		position: sticky;
		top: 84px;
		padding-right: 8px;
		z-index: 2;
	}

	.form-sidebar h2 {
		margin: 0 0 20px 0;
		font-size: 1.2em;
		color: var(--on-surface-color);
	}

	.form-section {
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e0e0e0;
	}

	.form-section h3 {
		margin: 0 0 10px 0;
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--on-surface-light-color);
	}

	label {
		display: block;
		margin-bottom: 8px;
	}

	.label-text {
		display: block;
		font-size: 0.8em;
		color: var(--on-surface-light-color);
		margin-bottom: 3px;
	}

	input[type='text'],
	input[type='date'],
	input[type='time'],
	input[type='number'],
	select,
	textarea {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85em;
		font-family: inherit;
		background: #fff;
		color: var(--on-surface-color);
		box-sizing: border-box;
	}

	textarea {
		resize: vertical;
	}

	input[type='file'] {
		font-size: 0.8em;
	}

	.input-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	/* ── Item Blocks (Guest) ── */

	.item-block {
		background: var(--surface-color);
		border-radius: 5px;
		padding: 10px 12px;
		margin-bottom: 8px;
	}

	.item-block-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		font-size: 0.85em;
		font-weight: bold;
		color: var(--on-surface-color);
	}

	.booked-under-label {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
		margin-bottom: 0;
		cursor: pointer;
	}

	.booked-under-label input[type='checkbox'] {
		width: auto;
		margin: 0;
		cursor: pointer;
	}

	.btn-remove {
		background: none;
		border: none;
		font-size: 1.2em;
		color: #999;
		cursor: pointer;
		line-height: 1;
		padding: 0 4px;
	}

	.btn-remove:hover {
		color: #e44;
	}

	.btn-add {
		display: block;
		width: 100%;
		padding: 8px;
		background: none;
		border: 1px dashed #bbb;
		border-radius: 4px;
		font-size: 0.85em;
		color: var(--on-surface-light-color);
		cursor: pointer;
		font-family: inherit;
	}

	.btn-add:hover {
		border-color: #888;
		color: var(--on-surface-color);
	}

	.btn-remove-text {
		background: none;
		border: none;
		font-size: 0.75em;
		color: #c44;
		cursor: pointer;
		padding: 2px 0;
		text-decoration: underline;
	}

	.logo-preview {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.logo-preview img {
		height: 32px;
		max-width: 80px;
		object-fit: contain;
	}

	/* ── Form Toolbar ── */

	.form-toolbar {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}

	.form-toolbar .btn-secondary {
		flex: 1;
		text-align: center;
	}

	/* ── Action Buttons ── */

	.form-actions {
		margin-top: 24px;
		margin-bottom: 40px;
	}

	.btn-print {
		display: block;
		width: 100%;
		padding: 12px;
		background: var(--on-surface-color);
		color: #fff;
		border: none;
		border-radius: 5px;
		font-size: 1em;
		font-family: inherit;
		cursor: pointer;
		font-weight: bold;
	}

	.btn-print:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		padding: 6px 12px;
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85em;
		font-family: inherit;
		color: var(--on-surface-light-color);
		cursor: pointer;
	}

	.btn-secondary:hover {
		border-color: #888;
		color: var(--on-surface-color);
	}

	.helper-text {
		font-size: 0.8em;
		color: var(--on-surface-light-color);
		margin: 0 0 8px 0;
		line-height: 1.4;
	}

	.prompt-textarea {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.78em;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		background: #fafafa;
		color: var(--on-surface-color);
		resize: vertical;
		box-sizing: border-box;
		margin-bottom: 6px;
	}

	.btn-copy {
		width: 100%;
	}

	/* ── Modal ── */

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 16px;
	}

	.modal-card {
		background: #fff;
		border-radius: 6px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		overflow-y: auto;
		padding: 20px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--on-surface-light-color);
	}

	.modal-section {
		margin-bottom: 12px;
	}

	.modal-divider {
		height: 0;
		border: none;
		border-top: 1px solid #e0e0e0;
		margin: 12px 0;
	}

	/* ── Preview Panel ── */

	.preview-panel {
		position: sticky;
		top: 84px;
	}

	.ticket {
		--paper: hsl(36 30% 96%);
		--ink: hsl(220 45% 12%);
		--ink-soft: hsl(220 20% 38%);
		--ink-muted: hsl(220 15% 60%);
		--accent: hsl(30 55% 45%);
		--paper-edge: hsl(36 15% 85%);

		background: var(--paper);
		background-image: radial-gradient(circle, var(--paper-edge) 0.5px, transparent 0.5px);
		background-size: 18px 18px;
		border: 1px solid var(--paper-edge);
		border-radius: 2px;
		padding: 48px 52px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 4px 16px rgba(0, 0, 0, 0.06);
		max-width: 860px;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		line-height: 1.55;
		color: var(--ink);
	}

	/* ── Font assignments ── */

	.ticket h1,
	.ticket h2,
	.value-lg {
		font-family: 'Playfair Display', Georgia, serif;
	}

	.value-mono {
		font-family: 'JetBrains Mono', 'Courier New', monospace;
	}

	/* ── Label / Value system ── */

	.label {
		display: block;
		font-size: 10px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: var(--ink-muted);
		margin-bottom: 1px;
	}

	.value {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
	}

	.value-lg {
		font-size: 24px;
		font-weight: 700;
		color: var(--ink);
		letter-spacing: -0.01em;
		line-height: 1.1;
	}

	.value-mono {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-soft);
	}

	/* ── Masthead ── */

	.ticket-masthead {
		margin: 0 0 8px 0;
		font-size: 28px;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--ink);
		text-align: center;
	}

	/* ── Perforation dotted line ── */

	.ticket-perf {
		height: 0;
		border: none;
		border-top: 2px dotted var(--paper-edge);
		margin: 16px 0;
	}

	/* ── Top section: hotel + refs ── */

	.ticket-top {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 24px;
		align-items: center;
	}

	.ticket-top-left {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.ticket-top-right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.ticket-hotel-logo {
		height: 40px;
		max-width: 100px;
		object-fit: contain;
	}

	.ticket-hotel-name {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.ticket-hotel-phone {
		font-size: 12px;
		color: var(--ink-soft);
	}

	/* ── Confirmation ── */

	.ticket-confirmation {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 24px;
		align-items: start;
	}

	.ticket-confirmation-left {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.ticket-confirmation-right {
		display: flex;
		justify-content: flex-end;
		gap: 20px;
		flex-wrap: wrap;
	}

	.ticket-ref-item {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.ticket-hotel-address {
		font-size: 11px;
		color: var(--ink-soft);
		white-space: pre-line;
		max-width: 260px;
		line-height: 1.5;
	}

	.ticket-hotel-gps {
		font-size: 11px;
		color: var(--ink-muted);
		font-family: 'JetBrains Mono', 'Courier New', monospace;
	}

	/* ── Section titles ── */

	.ticket-section-title {
		margin: 0 0 12px 0;
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: var(--ink-muted);
	}

	/* ── Stay Segment ── */

	.ticket-stay {
		margin-bottom: 4px;
	}

	.stay-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 20px;
		align-items: start;
	}

	.stay-col {
		display: flex;
		flex-direction: column;
	}

	.stay-col--center {
		align-items: center;
		text-align: center;
	}

	.stay-col--right {
		align-items: flex-end;
		text-align: right;
	}

	/* ── Center column: bed icon + dashes ── */

	.stay-icon-line {
		display: flex;
		align-items: center;
		gap: 0;
		margin-bottom: 8px;
	}

	.stay-icon-line::before,
	.stay-icon-line::after {
		content: '';
		width: 40px;
		border-top: 2px dashed var(--paper-edge);
	}

	.bed-icon {
		font-size: 15px;
		color: var(--accent);
		padding: 0 10px;
		flex-shrink: 0;
	}

	.stay-nights {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}

	/* ── Guests ── */

	.ticket-guests {
		margin-bottom: 4px;
	}

	.guests-summary {
		margin-bottom: 10px;
		font-size: 12px;
		color: var(--ink-muted);
		letter-spacing: 0.04em;
	}

	.ticket-guest-name {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 6px;
	}

	.booked-under-badge {
		font-size: 11px;
		color: var(--ink-muted);
		font-style: italic;
	}

	/* ── Issuer footer ── */

	.ticket-issuer {
		display: flex;
		align-items: baseline;
		justify-content: center;
		flex-wrap: wrap;
		gap: 4px 10px;
		padding-top: 10px;
		font-size: 11px;
		color: var(--ink-muted);
	}

	.ticket-issuer-logo {
		height: 14px;
		max-width: 50px;
		object-fit: contain;
		vertical-align: middle;
	}

	.ticket-issuer-contact {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
		font-size: 11px;
		color: var(--ink-muted);
	}

	.ticket-footer-text {
		font-size: 10px;
		color: var(--ink-muted);
		letter-spacing: 0.04em;
		margin-left: 4px;
	}

	.ticket-footer {
		text-align: center;
		font-size: 10px;
		color: var(--ink-muted);
		padding-top: 10px;
		letter-spacing: 0.04em;
	}

	/* ── Total ── */

	.ticket-total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-top: 12px;
	}

	.ticket-total-label {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: var(--ink-muted);
	}

	.ticket-total-value {
		font-size: 26px;
	}

	/* ── Footer ── */

	.ticket-footer {
		text-align: center;
		font-size: 10px;
		color: var(--ink-muted);
		margin-top: 20px;
		padding-top: 10px;
		letter-spacing: 0.06em;
	}

	/* ── Responsive ── */

	@media (max-width: 960px) {
		.app-layout {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.form-sidebar {
			position: static;
			max-height: none;
			overflow-y: visible;
		}

		.preview-panel {
			position: static;
		}

		.ticket {
			max-width: 100%;
			padding: 28px 22px;
		}

		.stay-grid {
			gap: 12px;
		}

		.value-lg {
			font-size: 20px;
		}
	}

	/* ── Print Styles ── */

	@media print {
		:global(body) {
			background: #fff !important;
		}

		:global(nav),
		.form-sidebar {
			display: none !important;
		}

		.app-layout {
			display: block !important;
			padding: 0 !important;
			max-width: none !important;
		}

		.preview-panel {
			position: static !important;
			top: auto !important;
		}

		.ticket {
			background: #fff !important;
			background-image: none !important;
			box-shadow: none !important;
			border: 1px solid #000 !important;
			border-radius: 0 !important;
			padding: 32px !important;
			max-width: 100% !important;
			font-size: 10pt;
			line-height: 1.5;
			color: #000 !important;
		}

		.ticket-perf {
			border-top-color: #999 !important;
		}

		.label {
			color: #444 !important;
		}

		.value-lg {
			color: #000 !important;
		}

		.bed-icon {
			color: #000 !important;
		}

		.ticket-footer {
			color: #999 !important;
		}

		@page {
			size: A4;
			margin: 10mm;
		}
	}
</style>
