<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	const LOCAL_STORAGE_KEY = 'airline-print-booking';
	const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
	const PASSENGER_TYPES = ['Adult', 'Child', 'Infant'];

	interface Passenger {
		name: string;
		type: string;
		eTicketNumber: string;
	}

	interface Contact {
		name: string;
		logo: string;
		phone: string;
		email: string;
		website: string;
		address: string;
	}

	interface Flight {
		flightNumber: string;
		origin: string;
		originCode: string;
		destination: string;
		destinationCode: string;
		date: string;
		arrivalDate: string;
		departureTime: string;
		arrivalTime: string;
		duration: string;
		originTerminal: string;
		destinationTerminal: string;
		class: string;
		passengerSeats: string[];
	}

	interface Booking {
		bookingId: string;
		pnr: string;
		currency: string;
		costAmount: string;
		airline: Contact;
		aggregator: Contact;
		passengers: Passenger[];
		outboundFlights: Flight[];
		returnFlights: Flight[];
	}

	function createEmptyPassenger(): Passenger {
		return { name: '', type: 'Adult', eTicketNumber: '' };
	}

	function createEmptyContact(): Contact {
		return { name: '', logo: '', phone: '', email: '', website: '', address: '' };
	}

	function createEmptyFlight(): Flight {
		return {
			flightNumber: '',
			origin: '',
			originCode: '',
			destination: '',
			destinationCode: '',
			date: '',
			arrivalDate: '',
			departureTime: '',
			arrivalTime: '',
			duration: '',
			originTerminal: '',
			destinationTerminal: '',
			class: '',
			passengerSeats: []
		};
	}

	let booking: Booking = $state({
		bookingId: '',
		pnr: '',
		currency: 'INR',
		costAmount: '',
		airline: createEmptyContact(),
		aggregator: createEmptyContact(),
		passengers: [createEmptyPassenger()],
		outboundFlights: [
			{
				...createEmptyFlight(),
				passengerSeats: ['']
			}
		],
		returnFlights: []
	});

	let mounted = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout>;

	function addPassenger() {
		booking.passengers.push(createEmptyPassenger());
		booking.outboundFlights.forEach((f) => f.passengerSeats.push(''));
		booking.returnFlights.forEach((f) => f.passengerSeats.push(''));
		scheduleSave();
	}

	function removePassenger(index: number) {
		booking.passengers.splice(index, 1);
		booking.outboundFlights.forEach((f) => f.passengerSeats.splice(index, 1));
		booking.returnFlights.forEach((f) => f.passengerSeats.splice(index, 1));
		scheduleSave();
	}

	function addOutboundFlight() {
		const seats = booking.passengers.map(() => '');
		booking.outboundFlights.push({ ...createEmptyFlight(), passengerSeats: seats });
		scheduleSave();
	}

	function removeOutboundFlight(index: number) {
		booking.outboundFlights.splice(index, 1);
		scheduleSave();
	}

	function addReturnFlight() {
		const seats = booking.passengers.map(() => '');
		booking.returnFlights.push({ ...createEmptyFlight(), passengerSeats: seats });
		scheduleSave();
	}

	function removeReturnFlight(index: number) {
		booking.returnFlights.splice(index, 1);
		scheduleSave();
	}

	async function handleLogoUpload(event: Event, target: 'airline' | 'aggregator'): Promise<void> {
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

	const allFlights = $derived([
		...booking.outboundFlights.map((f, i) => ({ ...f, section: 'outbound' as const, index: i })),
		...booking.returnFlights.map((f, i) => ({ ...f, section: 'return' as const, index: i }))
	]);

	function getSeatLabel(
		flight: { origin: string; originCode: string; destination: string; destinationCode: string },
		idx: number
	): string {
		const origin = flight.originCode || flight.origin;
		const dest = flight.destinationCode || flight.destination;
		if (origin && dest) {
			return `${origin}→${dest}`;
		}
		return `Flight ${idx + 1}`;
	}
</script>

<svelte:head>
	<title>Airline Print — Tools</title>
	<meta
		name="description"
		content="Generate beautiful, print-friendly flight reservation tickets"
	/>
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

		<section class="form-section">
			<h3>Booking Reference</h3>
			<label>
				<span class="label-text">Booking ID</span>
				<input type="text" bind:value={booking.bookingId} placeholder="e.g. BKG-123456" />
			</label>
			<label>
				<span class="label-text">PNR</span>
				<input type="text" bind:value={booking.pnr} placeholder="e.g. ABC123" />
			</label>
		</section>

		<section class="form-section">
			<h3>Airline</h3>
			<label>
				<span class="label-text">Name</span>
				<input type="text" bind:value={booking.airline.name} placeholder="e.g. IndiGo" />
			</label>
			<label>
				<span class="label-text">Logo</span>
				<input type="file" accept="image/*" onchange={(e) => handleLogoUpload(e, 'airline')} />
				{#if booking.airline.logo}
					<div class="logo-preview">
						<img src={booking.airline.logo} alt="Airline logo" />
						<button
							type="button"
							class="btn-remove-text"
							onclick={() => {
								booking.airline.logo = '';
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
				<input type="text" bind:value={booking.airline.phone} placeholder="+91-" />
			</label>
			<label>
				<span class="label-text">Email</span>
				<input type="email" bind:value={booking.airline.email} placeholder="help@airline.com" />
			</label>
			<label>
				<span class="label-text">Website</span>
				<input type="text" bind:value={booking.airline.website} placeholder="airline.com" />
			</label>
			<label>
				<span class="label-text">Address</span>
				<textarea bind:value={booking.airline.address} placeholder="Office address" rows={2}
				></textarea>
			</label>
		</section>

		<section class="form-section">
			<h3>Aggregator</h3>
			<label>
				<span class="label-text">Name</span>
				<input type="text" bind:value={booking.aggregator.name} placeholder="e.g. MakeMyTrip" />
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
				<span class="label-text">Email</span>
				<input
					type="email"
					bind:value={booking.aggregator.email}
					placeholder="support@aggregator.com"
				/>
			</label>
			<label>
				<span class="label-text">Website</span>
				<input type="text" bind:value={booking.aggregator.website} placeholder="aggregator.com" />
			</label>
			<label>
				<span class="label-text">Address</span>
				<textarea bind:value={booking.aggregator.address} placeholder="Office address" rows={2}
				></textarea>
			</label>
		</section>

		<section class="form-section">
			<h3>Passengers</h3>
			{#each booking.passengers as passenger, i}
				<div class="item-block">
					<div class="item-block-header">
						<span>Passenger {i + 1}</span>
						<button type="button" class="btn-remove" onclick={() => removePassenger(i)}>
							&times;
						</button>
					</div>
					<label>
						<span class="label-text">Name</span>
						<input type="text" bind:value={passenger.name} placeholder="Full name" />
					</label>
					<label>
						<span class="label-text">Type</span>
						<select bind:value={passenger.type}>
							{#each PASSENGER_TYPES as ptype}
								<option value={ptype}>{ptype}</option>
							{/each}
						</select>
					</label>
					<label>
						<span class="label-text">e-Ticket No.</span>
						<input
							type="text"
							bind:value={passenger.eTicketNumber}
							placeholder="e.g. 176-1234567890"
						/>
					</label>
				</div>
			{/each}
			<button type="button" class="btn-add" onclick={addPassenger}> + Add Passenger </button>
		</section>

		<section class="form-section">
			<h3>Outbound Flights</h3>
			{#each booking.outboundFlights as flight, i}
				<div class="item-block">
					<div class="item-block-header">
						<span>Flight {i + 1}</span>
						<button type="button" class="btn-remove" onclick={() => removeOutboundFlight(i)}>
							&times;
						</button>
					</div>
					<label>
						<span class="label-text">Flight No.</span>
						<input type="text" bind:value={flight.flightNumber} placeholder="e.g. 6E-123" />
					</label>
					<div class="input-row">
						<label>
							<span class="label-text">Origin</span>
							<input type="text" bind:value={flight.origin} placeholder="Bengaluru" />
						</label>
						<label>
							<span class="label-text">Code</span>
							<input type="text" bind:value={flight.originCode} placeholder="BLR" size={5} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Destination</span>
							<input type="text" bind:value={flight.destination} placeholder="Delhi" />
						</label>
						<label>
							<span class="label-text">Code</span>
							<input type="text" bind:value={flight.destinationCode} placeholder="DEL" size={5} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Term (Origin)</span>
							<input type="text" bind:value={flight.originTerminal} placeholder="T1" />
						</label>
						<label>
							<span class="label-text">Term (Dest)</span>
							<input type="text" bind:value={flight.destinationTerminal} placeholder="T3" />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Date</span>
							<input type="date" bind:value={flight.date} />
						</label>
						<label>
							<span class="label-text">Arrival Date</span>
							<input type="date" bind:value={flight.arrivalDate} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Departure</span>
							<input type="time" bind:value={flight.departureTime} />
						</label>
						<label>
							<span class="label-text">Arrival</span>
							<input type="time" bind:value={flight.arrivalTime} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Duration</span>
							<input type="text" bind:value={flight.duration} placeholder="2h 30m" />
						</label>
						<label>
							<span class="label-text">Class</span>
							<input type="text" bind:value={flight.class} placeholder="Economy" />
						</label>
					</div>
					{#if booking.passengers.filter((p) => p.name.trim()).length > 0}
						<div class="seats-row">
							<span class="label-text">Seats</span>
							<div class="seat-inputs">
								{#each booking.passengers as passenger, pi}
									{#if passenger.name.trim()}
										<label class="seat-label">
											<span>{passenger.name || `P${pi + 1}`}</span>
											<input
												type="text"
												bind:value={flight.passengerSeats[pi]}
												placeholder="-"
												size={4}
											/>
										</label>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
			<button type="button" class="btn-add" onclick={addOutboundFlight}>
				+ Add Outbound Flight
			</button>
		</section>

		<section class="form-section">
			<h3>Return Flights</h3>
			{#each booking.returnFlights as flight, i}
				<div class="item-block">
					<div class="item-block-header">
						<span>Return Flight {i + 1}</span>
						<button type="button" class="btn-remove" onclick={() => removeReturnFlight(i)}>
							&times;
						</button>
					</div>
					<label>
						<span class="label-text">Flight No.</span>
						<input type="text" bind:value={flight.flightNumber} placeholder="e.g. 6E-456" />
					</label>
					<div class="input-row">
						<label>
							<span class="label-text">Origin</span>
							<input type="text" bind:value={flight.origin} placeholder="Delhi" />
						</label>
						<label>
							<span class="label-text">Code</span>
							<input type="text" bind:value={flight.originCode} placeholder="DEL" size={5} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Destination</span>
							<input type="text" bind:value={flight.destination} placeholder="Bengaluru" />
						</label>
						<label>
							<span class="label-text">Code</span>
							<input type="text" bind:value={flight.destinationCode} placeholder="BLR" size={5} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Term (Origin)</span>
							<input type="text" bind:value={flight.originTerminal} placeholder="T3" />
						</label>
						<label>
							<span class="label-text">Term (Dest)</span>
							<input type="text" bind:value={flight.destinationTerminal} placeholder="T1" />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Date</span>
							<input type="date" bind:value={flight.date} />
						</label>
						<label>
							<span class="label-text">Arrival Date</span>
							<input type="date" bind:value={flight.arrivalDate} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Departure</span>
							<input type="time" bind:value={flight.departureTime} />
						</label>
						<label>
							<span class="label-text">Arrival</span>
							<input type="time" bind:value={flight.arrivalTime} />
						</label>
					</div>
					<div class="input-row">
						<label>
							<span class="label-text">Duration</span>
							<input type="text" bind:value={flight.duration} placeholder="2h 30m" />
						</label>
						<label>
							<span class="label-text">Class</span>
							<input type="text" bind:value={flight.class} placeholder="Economy" />
						</label>
					</div>
					{#if booking.passengers.filter((p) => p.name.trim()).length > 0}
						<div class="seats-row">
							<span class="label-text">Seats</span>
							<div class="seat-inputs">
								{#each booking.passengers as passenger, pi}
									{#if passenger.name.trim()}
										<label class="seat-label">
											<span>{passenger.name || `P${pi + 1}`}</span>
											<input
												type="text"
												bind:value={flight.passengerSeats[pi]}
												placeholder="-"
												size={4}
											/>
										</label>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
			<button type="button" class="btn-add" onclick={addReturnFlight}> + Add Return Flight </button>
		</section>

		<section class="form-section">
			<h3>Total Cost</h3>
			<div class="input-row">
				<label>
					<span class="label-text">Currency</span>
					<select bind:value={booking.currency}>
						{#each CURRENCIES as cur}
							<option value={cur}>{cur}</option>
						{/each}
					</select>
				</label>
				<label>
					<span class="label-text">Amount</span>
					<input type="text" bind:value={booking.costAmount} placeholder="12,500" />
				</label>
			</div>
		</section>

		<div class="form-actions">
			<button type="button" class="btn-print" onclick={printTicket}> Download PDF </button>
		</div>
	</div>

	<div class="preview-panel">
		<div class="ticket">
			<h1 class="ticket-masthead">E-Ticket Itinerary</h1>

			<div class="ticket-perf"></div>

			{#if isNonEmpty(booking.airline.name) || booking.airline.logo || isNonEmpty(booking.bookingId) || isNonEmpty(booking.pnr)}
				<div class="ticket-top">
					<div class="ticket-top-left">
						{#if booking.airline.logo}
							<img
								class="ticket-airline-logo"
								src={booking.airline.logo}
								alt={booking.airline.name || 'Airline'}
							/>
						{/if}
						{#if isNonEmpty(booking.airline.name)}
							<h2 class="ticket-airline-name">{booking.airline.name}</h2>
						{/if}
						{#if isNonEmpty(booking.airline.phone) || isNonEmpty(booking.airline.email) || isNonEmpty(booking.airline.website)}
							<div class="ticket-airline-contact">
								{#if isNonEmpty(booking.airline.phone)}<span>{booking.airline.phone}</span>{/if}
								{#if isNonEmpty(booking.airline.email)}<span>{booking.airline.email}</span>{/if}
								{#if isNonEmpty(booking.airline.website)}<span>{booking.airline.website}</span>{/if}
							</div>
						{/if}
						{#if isNonEmpty(booking.airline.address)}
							<div class="ticket-airline-address">{booking.airline.address}</div>
						{/if}
					</div>
					<div class="ticket-top-right">
						<!-- <span class="ticket-icon"><Icon icon="mdi:ticket-confirmation-outline" /></span> -->
						{#if isNonEmpty(booking.pnr)}
							<div class="ticket-ref-item">
								<span class="label">PNR</span>
								<span class="value-mono">{booking.pnr}</span>
							</div>
						{/if}
						{#if isNonEmpty(booking.bookingId)}
							<div class="ticket-ref-item">
								<span class="label">Booking ID</span>
								<span class="value-mono">{booking.bookingId}</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if booking.outboundFlights.some((f) => f.flightNumber.trim() || f.origin.trim() || f.destination.trim())}
				<h2 class="ticket-section-title">Outbound</h2>
				{#each booking.outboundFlights as flight, i}
					{@const hasFlight =
						flight.flightNumber.trim() || flight.origin.trim() || flight.destination.trim()}
					{#if hasFlight}
						<div class="ticket-segment">
							<div class="segment-grid">
								<div class="seg-col">
									<span class="label">From</span>
									{#if isNonEmpty(flight.origin)}
										<span class="value-lg">{flight.origin}</span>
									{/if}
									{#if isNonEmpty(flight.originCode) || isNonEmpty(flight.originTerminal)}
										<span class="value-mono"
											>{#if isNonEmpty(flight.originCode)}{flight.originCode}{/if}{#if isNonEmpty(flight.originCode) && isNonEmpty(flight.originTerminal)}
												&nbsp;|&nbsp;{/if}{#if isNonEmpty(flight.originTerminal)}{flight.originTerminal}{/if}</span
										>
									{/if}
									{#if isNonEmpty(flight.departureTime)}
										<span class="segment-time-value">{formatTime(flight.departureTime)}</span>
									{/if}
									{#if isNonEmpty(flight.date)}
										<span class="segment-time-date">{formatDate(flight.date)}</span>
									{/if}
								</div>

								<div class="seg-col seg-col--center">
									<div class="segment-plane-line">
										<span class="plane-icon"><Icon icon="mdi:airplane" /></span>
									</div>
									{#if isNonEmpty(flight.duration)}
										<span class="segment-duration">{flight.duration}</span>
									{/if}
									{#if isNonEmpty(flight.flightNumber)}
										<span class="value-mono segment-flight-num">{flight.flightNumber}</span>
									{/if}
									{#if isNonEmpty(flight.class)}
										<span class="segment-class">{flight.class}</span>
									{/if}
								</div>

								<div class="seg-col seg-col--right">
									<span class="label">To</span>
									{#if isNonEmpty(flight.destination)}
										<span class="value-lg">{flight.destination}</span>
									{/if}
									{#if isNonEmpty(flight.destinationCode) || isNonEmpty(flight.destinationTerminal)}
										<span class="value-mono"
											>{#if isNonEmpty(flight.destinationCode)}{flight.destinationCode}{/if}{#if isNonEmpty(flight.destinationCode) && isNonEmpty(flight.destinationTerminal)}
												&nbsp;|&nbsp;{/if}{#if isNonEmpty(flight.destinationTerminal)}{flight.destinationTerminal}{/if}</span
										>
									{/if}
									{#if isNonEmpty(flight.arrivalTime)}
										<span class="segment-time-value">{formatTime(flight.arrivalTime)}</span>
									{/if}
									{#if isNonEmpty(flight.arrivalDate || flight.date)}
										<span class="segment-time-date"
											>{formatDate(flight.arrivalDate || flight.date)}</span
										>
									{/if}
								</div>
							</div>
						</div>
						{#if i < booking.outboundFlights.length - 1}
							<div class="ticket-perf"></div>
						{/if}
					{/if}
				{/each}
				<div class="ticket-perf"></div>
			{/if}

			{#if booking.returnFlights.some((f) => f.flightNumber.trim() || f.origin.trim() || f.destination.trim())}
				<h2 class="ticket-section-title">Return</h2>
				{#each booking.returnFlights as flight, i}
					{@const hasFlight =
						flight.flightNumber.trim() || flight.origin.trim() || flight.destination.trim()}
					{#if hasFlight}
						<div class="ticket-segment">
							<div class="segment-grid">
								<div class="seg-col">
									<span class="label">From</span>
									{#if isNonEmpty(flight.origin)}
										<span class="value-lg">{flight.origin}</span>
									{/if}
									{#if isNonEmpty(flight.originCode) || isNonEmpty(flight.originTerminal)}
										<span class="value-mono"
											>{#if isNonEmpty(flight.originCode)}{flight.originCode}{/if}{#if isNonEmpty(flight.originCode) && isNonEmpty(flight.originTerminal)}
												&nbsp;|&nbsp;{/if}{#if isNonEmpty(flight.originTerminal)}{flight.originTerminal}{/if}</span
										>
									{/if}
									{#if isNonEmpty(flight.departureTime)}
										<span class="segment-time-value">{formatTime(flight.departureTime)}</span>
									{/if}
									{#if isNonEmpty(flight.date)}
										<span class="segment-time-date">{formatDate(flight.date)}</span>
									{/if}
								</div>

								<div class="seg-col seg-col--center">
									<div class="segment-plane-line">
										<span class="plane-icon"><Icon icon="mdi:airplane" /></span>
									</div>
									{#if isNonEmpty(flight.duration)}
										<span class="segment-duration">{flight.duration}</span>
									{/if}
									{#if isNonEmpty(flight.flightNumber)}
										<span class="value-mono segment-flight-num">{flight.flightNumber}</span>
									{/if}
									{#if isNonEmpty(flight.class)}
										<span class="segment-class">{flight.class}</span>
									{/if}
								</div>

								<div class="seg-col seg-col--right">
									<span class="label">To</span>
									{#if isNonEmpty(flight.destination)}
										<span class="value-lg">{flight.destination}</span>
									{/if}
									{#if isNonEmpty(flight.destinationCode) || isNonEmpty(flight.destinationTerminal)}
										<span class="value-mono"
											>{#if isNonEmpty(flight.destinationCode)}{flight.destinationCode}{/if}{#if isNonEmpty(flight.destinationCode) && isNonEmpty(flight.destinationTerminal)}
												&nbsp;|&nbsp;{/if}{#if isNonEmpty(flight.destinationTerminal)}{flight.destinationTerminal}{/if}</span
										>
									{/if}
									{#if isNonEmpty(flight.arrivalTime)}
										<span class="segment-time-value">{formatTime(flight.arrivalTime)}</span>
									{/if}
									{#if isNonEmpty(flight.arrivalDate || flight.date)}
										<span class="segment-time-date"
											>{formatDate(flight.arrivalDate || flight.date)}</span
										>
									{/if}
								</div>
							</div>
						</div>
						{#if i < booking.returnFlights.length - 1}
							<div class="ticket-perf"></div>
						{/if}
					{/if}
				{/each}
				<div class="ticket-perf"></div>
			{/if}

			{#if booking.passengers.some((p) => isNonEmpty(p.name))}
				<h2 class="ticket-section-title">Passengers</h2>
				{#each booking.passengers as passenger, pi}
					{#if isNonEmpty(passenger.name)}
						<div class="ticket-passenger">
							<div class="passenger-main">
								<span class="passenger-name">
									<span class="value">{passenger.name}</span>
									<span class="passenger-type">({passenger.type})</span>
								</span>
								{#if isNonEmpty(passenger.eTicketNumber)}
									<span class="passenger-eticket">
										<span class="label">e-Ticket</span>
										<span class="value-mono">{passenger.eTicketNumber}</span>
									</span>
								{/if}
							</div>
							{#if allFlights.some((f) => isNonEmpty(f.passengerSeats[pi]))}
								<div class="passenger-seats">
									<span class="ticket-icon ticket-icon--sm"><Icon icon="mdi:seat-passenger" /></span
									>
									{#each allFlights as flight}
										{#if isNonEmpty(flight.passengerSeats[pi])}
											<span class="seat-badge">
												<span class="value-mono">{flight.passengerSeats[pi]}</span>
												<span class="seat-route">({getSeatLabel(flight, flight.index)})</span>
											</span>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
						{#if pi < booking.passengers.length - 1 && isNonEmpty(booking.passengers[pi + 1]?.name || '')}
							<div class="ticket-perf"></div>
						{/if}
					{/if}
				{/each}
				<div class="ticket-perf"></div>
			{/if}

			{#if isNonEmpty(booking.costAmount)}
				<div class="ticket-total">
					<span class="ticket-total-label">Total Fare</span>
					<span class="ticket-total-value value-lg"
						>{booking.currency === 'INR' ? '₹' : booking.currency + ' '}{booking.costAmount}</span
					>
				</div>
				<div class="ticket-perf"></div>
			{/if}

			{#if isNonEmpty(booking.aggregator.name)}
				<div class="ticket-issuer">
					<span class="label">Issued by</span>
					{#if booking.aggregator.logo}
						<img
							class="ticket-issuer-logo"
							src={booking.aggregator.logo}
							alt={booking.aggregator.name}
						/>
					{/if}
					<span class="value">{booking.aggregator.name}</span>
					{#if isNonEmpty(booking.aggregator.phone) || isNonEmpty(booking.aggregator.email) || isNonEmpty(booking.aggregator.website)}
						<span class="ticket-issuer-contact">
							{#if isNonEmpty(booking.aggregator.phone)}<span>{booking.aggregator.phone}</span>{/if}
							{#if isNonEmpty(booking.aggregator.email)}<span>{booking.aggregator.email}</span>{/if}
							{#if isNonEmpty(booking.aggregator.website)}<span>{booking.aggregator.website}</span
								>{/if}
						</span>
					{/if}
					<span class="ticket-footer-text">Generated by Airline Print</span>
				</div>
			{:else}
				<div class="ticket-footer">Generated by Airline Print</div>
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
	input[type='email'],
	input[type='date'],
	input[type='time'],
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

	/* ── Item Blocks (Passenger / Flight) ── */

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

	/* ── Seats Row ── */

	.seats-row {
		margin-top: 8px;
		padding-top: 6px;
		border-top: 1px dotted #ddd;
	}

	.seat-inputs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
	}

	.seat-label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.78em;
		margin-bottom: 0;
	}

	.seat-label span {
		color: var(--on-surface-light-color);
		white-space: nowrap;
	}

	.seat-label input {
		width: auto !important;
		min-width: 44px;
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

	/* ── Icons ── */

	.ticket-icon {
		font-size: 16px;
		color: var(--ink-muted);
		flex-shrink: 0;
	}

	.ticket-icon--sm {
		font-size: 13px;
	}

	/* ── Top section: airline + refs ── */

	.ticket-top {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 24px;
		align-items: start;
	}

	.ticket-top-left {
		display: flex;
		flex-direction: column;
	}

	.ticket-top-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
		gap: 6px;
	}

	.ticket-ref-item {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.ticket-airline-logo {
		height: 40px;
		max-width: 100px;
		object-fit: contain;
		margin-bottom: 4px;
	}

	.ticket-airline-name {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.ticket-airline-contact {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		margin-top: 4px;
		font-size: 12px;
		color: var(--ink-soft);
	}

	.ticket-airline-address {
		font-size: 11px;
		color: var(--ink-muted);
		margin-top: 2px;
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

	/* ── Flight Segment ── */

	.ticket-segment {
		margin-bottom: 4px;
	}

	.segment-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 20px;
		align-items: start;
	}

	.seg-col {
		display: flex;
		flex-direction: column;
	}

	.seg-col--center {
		align-items: center;
		text-align: center;
	}

	.seg-col--right {
		align-items: flex-end;
		text-align: right;
	}

	/* ── Center column: plane + dashes ── */

	.segment-plane-line {
		display: flex;
		align-items: center;
		gap: 0;
		margin-bottom: 8px;
	}

	.segment-plane-line::before,
	.segment-plane-line::after {
		content: '';
		width: 40px;
		border-top: 2px dashed var(--paper-edge);
	}

	.plane-icon {
		font-size: 15px;
		color: var(--accent);
		padding: 0 10px;
		flex-shrink: 0;
	}

	.segment-duration {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
		margin-bottom: 4px;
	}

	.segment-flight-num {
		margin-bottom: 2px;
	}

	.segment-class {
		font-size: 12px;
		color: var(--ink-muted);
		font-style: italic;
	}

	/* ── Time values within columns ── */

	.segment-time-value {
		font-size: 20px;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.2;
		margin-top: 8px;
	}

	.segment-time-date {
		font-size: 12px;
		color: var(--ink-soft);
		margin-top: 2px;
	}

	/* ── Passenger Block ── */

	.ticket-passenger {
		margin-bottom: 4px;
	}

	.passenger-main {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 20px;
		margin-bottom: 4px;
	}

	.passenger-eticket {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.passenger-name {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.passenger-type {
		font-size: 12px;
		color: var(--ink-muted);
	}

	.passenger-seats {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 12px;
		font-size: 12px;
		color: var(--ink-soft);
	}

	.seat-badge {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
	}

	.seat-route {
		font-size: 11px;
		color: var(--ink-muted);
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

		.segment-grid {
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

		.plane-icon {
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
