<script lang="ts">
	import { onMount } from 'svelte';

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
		destination: string;
		date: string;
		departureTime: string;
		arrivalTime: string;
		duration: string;
		terminal: string;
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
			destination: '',
			date: '',
			departureTime: '',
			arrivalTime: '',
			duration: '',
			terminal: '',
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
					resolve(canvas.toDataURL('image/jpeg', 0.7));
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

	function getSeatLabel(flight: { origin: string; destination: string }, idx: number): string {
		if (flight.origin && flight.destination) {
			return `${flight.origin}→${flight.destination}`;
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
							<input type="text" bind:value={flight.origin} placeholder="BLR" />
						</label>
						<label>
							<span class="label-text">Destination</span>
							<input type="text" bind:value={flight.destination} placeholder="DEL" />
						</label>
					</div>
					<label>
						<span class="label-text">Date</span>
						<input type="date" bind:value={flight.date} />
					</label>
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
							<span class="label-text">Terminal</span>
							<input type="text" bind:value={flight.terminal} placeholder="T1" />
						</label>
					</div>
					<label>
						<span class="label-text">Class</span>
						<input type="text" bind:value={flight.class} placeholder="Economy" />
					</label>
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
							<input type="text" bind:value={flight.origin} placeholder="DEL" />
						</label>
						<label>
							<span class="label-text">Destination</span>
							<input type="text" bind:value={flight.destination} placeholder="BLR" />
						</label>
					</div>
					<label>
						<span class="label-text">Date</span>
						<input type="date" bind:value={flight.date} />
					</label>
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
							<span class="label-text">Terminal</span>
							<input type="text" bind:value={flight.terminal} placeholder="T2" />
						</label>
					</div>
					<label>
						<span class="label-text">Class</span>
						<input type="text" bind:value={flight.class} placeholder="Economy" />
					</label>
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
			{#if isNonEmpty(booking.airline.name) || booking.airline.logo}
				<div class="ticket-header">
					{#if booking.airline.logo}
						<img
							class="ticket-airline-logo"
							src={booking.airline.logo}
							alt={booking.airline.name || 'Airline'}
						/>
					{/if}
					{#if isNonEmpty(booking.airline.name)}
						<h1 class="ticket-airline-name">{booking.airline.name}</h1>
					{/if}
				</div>
			{/if}

			{#if isNonEmpty(booking.bookingId) || isNonEmpty(booking.pnr)}
				<div class="ticket-refs">
					{#if isNonEmpty(booking.bookingId)}
						<span>Booking ID: <strong>{booking.bookingId}</strong></span>
					{/if}
					{#if isNonEmpty(booking.pnr)}
						<span>PNR: <strong>{booking.pnr}</strong></span>
					{/if}
				</div>
			{/if}

			{#if booking.outboundFlights.some((f) => f.flightNumber.trim() && f.origin.trim() && f.destination.trim())}
				<div class="ticket-section">
					<h2 class="ticket-section-title">Outbound</h2>
					{#each booking.outboundFlights as flight, i}
						{@const hasFlight =
							flight.flightNumber.trim() || flight.origin.trim() || flight.destination.trim()}
						{#if hasFlight}
							<div class="ticket-flight">
								<div class="ticket-flight-main">
									<div class="ticket-flight-route">
										{#if isNonEmpty(flight.flightNumber)}
											<span class="ticket-flight-number">{flight.flightNumber}</span>
										{/if}
										<span class="ticket-flight-cities">
											{#if isNonEmpty(flight.origin)}
												<span>{flight.origin}</span>
											{/if}
											{#if isNonEmpty(flight.origin) && isNonEmpty(flight.destination)}
												<span class="arrow">&rarr;</span>
											{/if}
											{#if isNonEmpty(flight.destination)}
												<span>{flight.destination}</span>
											{/if}
										</span>
									</div>
									<div class="ticket-flight-meta">
										{#if isNonEmpty(flight.date)}
											<span class="ticket-flight-date">{formatDate(flight.date)}</span>
										{/if}
										{#if isNonEmpty(flight.departureTime) || isNonEmpty(flight.arrivalTime)}
											<span class="ticket-flight-times">
												{#if isNonEmpty(flight.departureTime)}
													{formatTime(flight.departureTime)}
												{/if}
												{#if isNonEmpty(flight.departureTime) && isNonEmpty(flight.arrivalTime)}
													<span class="time-sep">&mdash;</span>
												{/if}
												{#if isNonEmpty(flight.arrivalTime)}
													{formatTime(flight.arrivalTime)}
												{/if}
											</span>
										{/if}
										{#if isNonEmpty(flight.duration)}
											<span class="ticket-flight-duration">{flight.duration}</span>
										{/if}
									</div>
									<div class="ticket-flight-extra">
										{#if isNonEmpty(flight.terminal)}
											<span>Terminal {flight.terminal}</span>
										{/if}
										{#if isNonEmpty(flight.class)}
											<span class="ticket-flight-class">{flight.class}</span>
										{/if}
									</div>
								</div>
							</div>
							{#if i < booking.outboundFlights.length - 1}
								<div class="flight-connector"></div>
							{/if}
						{/if}
					{/each}
				</div>
			{/if}

			{#if booking.returnFlights.some((f) => f.flightNumber.trim() && f.origin.trim() && f.destination.trim())}
				<div class="ticket-section">
					<h2 class="ticket-section-title">Return</h2>
					{#each booking.returnFlights as flight, i}
						{@const hasFlight =
							flight.flightNumber.trim() || flight.origin.trim() || flight.destination.trim()}
						{#if hasFlight}
							<div class="ticket-flight">
								<div class="ticket-flight-main">
									<div class="ticket-flight-route">
										{#if isNonEmpty(flight.flightNumber)}
											<span class="ticket-flight-number">{flight.flightNumber}</span>
										{/if}
										<span class="ticket-flight-cities">
											{#if isNonEmpty(flight.origin)}
												<span>{flight.origin}</span>
											{/if}
											{#if isNonEmpty(flight.origin) && isNonEmpty(flight.destination)}
												<span class="arrow">&rarr;</span>
											{/if}
											{#if isNonEmpty(flight.destination)}
												<span>{flight.destination}</span>
											{/if}
										</span>
									</div>
									<div class="ticket-flight-meta">
										{#if isNonEmpty(flight.date)}
											<span class="ticket-flight-date">{formatDate(flight.date)}</span>
										{/if}
										{#if isNonEmpty(flight.departureTime) || isNonEmpty(flight.arrivalTime)}
											<span class="ticket-flight-times">
												{#if isNonEmpty(flight.departureTime)}
													{formatTime(flight.departureTime)}
												{/if}
												{#if isNonEmpty(flight.departureTime) && isNonEmpty(flight.arrivalTime)}
													<span class="time-sep">&mdash;</span>
												{/if}
												{#if isNonEmpty(flight.arrivalTime)}
													{formatTime(flight.arrivalTime)}
												{/if}
											</span>
										{/if}
										{#if isNonEmpty(flight.duration)}
											<span class="ticket-flight-duration">{flight.duration}</span>
										{/if}
									</div>
									<div class="ticket-flight-extra">
										{#if isNonEmpty(flight.terminal)}
											<span>Terminal {flight.terminal}</span>
										{/if}
										{#if isNonEmpty(flight.class)}
											<span class="ticket-flight-class">{flight.class}</span>
										{/if}
									</div>
								</div>
							</div>
							{#if i < booking.returnFlights.length - 1}
								<div class="flight-connector"></div>
							{/if}
						{/if}
					{/each}
				</div>
			{/if}

			{#if booking.passengers.some((p) => isNonEmpty(p.name))}
				<div class="ticket-section">
					<h2 class="ticket-section-title">Passengers</h2>
					{#each booking.passengers as passenger, pi}
						{#if isNonEmpty(passenger.name)}
							<div class="ticket-passenger">
								<div class="ticket-passenger-name">
									<span>{passenger.name}</span>
									<span class="ticket-passenger-type">({passenger.type})</span>
								</div>
								{#if isNonEmpty(passenger.eTicketNumber)}
									<div class="ticket-eticket">
										e-Ticket: {passenger.eTicketNumber}
									</div>
								{/if}
								{#if allFlights.some((f) => isNonEmpty(f.passengerSeats[pi]))}
									<div class="ticket-seats">
										<span class="ticket-seats-label">Seats:</span>
										{#each allFlights as flight}
											{#if isNonEmpty(flight.passengerSeats[pi])}
												<span class="ticket-seat-item">
													{flight.passengerSeats[pi]}
													<span class="ticket-seat-route">
														({getSeatLabel(flight, flight.index)})</span
													>
												</span>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			{#if isNonEmpty(booking.aggregator.name)}
				<div class="ticket-section">
					<h2 class="ticket-section-title">Booking Info</h2>
					<div class="ticket-aggregator">
						<div class="ticket-aggregator-header">
							{#if booking.aggregator.logo}
								<img
									class="ticket-aggregator-logo"
									src={booking.aggregator.logo}
									alt={booking.aggregator.name}
								/>
							{/if}
							<span class="ticket-aggregator-name">Booked via {booking.aggregator.name}</span>
						</div>
						<div class="ticket-aggregator-contacts">
							{#if isNonEmpty(booking.aggregator.phone)}
								<span>{booking.aggregator.phone}</span>
							{/if}
							{#if isNonEmpty(booking.aggregator.email)}
								<span>{booking.aggregator.email}</span>
							{/if}
							{#if isNonEmpty(booking.aggregator.website)}
								<span>{booking.aggregator.website}</span>
							{/if}
						</div>
						{#if isNonEmpty(booking.aggregator.address)}
							<div class="ticket-aggregator-address">
								{booking.aggregator.address}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if isNonEmpty(booking.costAmount)}
				<div class="ticket-total">
					<span class="ticket-total-label">Total</span>
					<span class="ticket-total-value"
						>{booking.currency === 'INR' ? '₹' : booking.currency + ' '}{booking.costAmount}</span
					>
				</div>
			{/if}

			<div class="ticket-footer">Generated by Airline Print</div>
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
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		padding: 40px 44px;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
		max-width: 680px;
		font-size: 0.92em;
		line-height: 1.6;
		color: #1a1d23;
	}

	/* ── Ticket Header ── */

	.ticket-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e0e0e0;
	}

	.ticket-airline-logo {
		height: 48px;
		max-width: 120px;
		object-fit: contain;
	}

	.ticket-airline-name {
		margin: 0;
		font-size: 1.5em;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	/* ── Ticket Refs ── */

	.ticket-refs {
		display: flex;
		gap: 32px;
		margin-bottom: 20px;
		padding-bottom: 14px;
		border-bottom: 1px solid #e0e0e0;
		font-size: 0.88em;
		color: var(--on-surface-light-color);
	}

	.ticket-refs strong {
		color: var(--on-surface-color);
	}

	/* ── Ticket Sections ── */

	.ticket-section {
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e0e0e0;
	}

	.ticket-section:last-of-type {
		border-bottom: none;
	}

	.ticket-section-title {
		margin: 0 0 12px 0;
		font-size: 0.8em;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--on-surface-light-color);
		font-weight: 600;
	}

	/* ── Flight Block ── */

	.ticket-flight {
		margin-bottom: 12px;
	}

	.ticket-flight-main {
		padding: 0;
	}

	.ticket-flight-route {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 4px;
	}

	.ticket-flight-number {
		font-weight: 700;
		font-size: 1.05em;
	}

	.ticket-flight-cities {
		font-size: 1em;
		color: var(--on-surface-color);
	}

	.arrow {
		margin: 0 6px;
		color: var(--on-surface-light-color);
	}

	.ticket-flight-meta {
		display: flex;
		gap: 16px;
		font-size: 0.88em;
		color: var(--on-surface-light-color);
		margin-bottom: 2px;
	}

	.ticket-flight-extra {
		display: flex;
		gap: 16px;
		font-size: 0.82em;
		color: var(--on-surface-light-color);
	}

	.ticket-flight-class {
		font-style: italic;
	}

	.flight-connector {
		height: 8px;
		border-left: 2px dotted #ccc;
		margin-left: 8px;
	}

	/* ── Passenger Block ── */

	.ticket-passenger {
		margin-bottom: 12px;
	}

	.ticket-passenger-name {
		font-weight: 600;
	}

	.ticket-passenger-type {
		font-weight: 400;
		font-size: 0.85em;
		color: var(--on-surface-light-color);
		margin-left: 4px;
	}

	.ticket-eticket {
		font-size: 0.82em;
		color: var(--on-surface-light-color);
		margin-top: 1px;
	}

	.ticket-seats {
		font-size: 0.82em;
		color: var(--on-surface-light-color);
		margin-top: 2px;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
	}

	.ticket-seats-label {
		font-weight: 500;
	}

	.ticket-seat-item {
		white-space: nowrap;
	}

	.ticket-seat-route {
		font-size: 0.9em;
		color: #999;
	}

	/* ── Aggregator ── */

	.ticket-aggregator {
		font-size: 0.85em;
		color: var(--on-surface-light-color);
	}

	.ticket-aggregator-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
	}

	.ticket-aggregator-logo {
		height: 28px;
		max-width: 80px;
		object-fit: contain;
	}

	.ticket-aggregator-name {
		font-weight: 500;
		color: var(--on-surface-color);
	}

	.ticket-aggregator-contacts {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-bottom: 4px;
	}

	.ticket-aggregator-address {
		font-size: 0.9em;
		color: #999;
		margin-top: 2px;
	}

	/* ── Total ── */

	.ticket-total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-top: 16px;
		border-top: 2px solid #ddd;
		margin-top: 8px;
	}

	.ticket-total-label {
		font-size: 0.88em;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--on-surface-light-color);
	}

	.ticket-total-value {
		font-size: 1.3em;
		font-weight: 700;
	}

	/* ── Footer ── */

	.ticket-footer {
		text-align: center;
		font-size: 0.7em;
		color: #ccc;
		margin-top: 24px;
		padding-top: 12px;
		border-top: 1px solid #eee;
		letter-spacing: 0.04em;
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
			padding: 28px 24px;
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
		}

		.preview-panel {
			position: static !important;
			top: auto !important;
		}

		.ticket {
			box-shadow: none !important;
			border: none !important;
			border-radius: 0 !important;
			padding: 0 !important;
			max-width: 100% !important;
			font-size: 10pt;
			line-height: 1.5;
			color: #000;
		}

		.ticket-section {
			border-bottom-color: #999 !important;
		}

		.ticket-footer {
			color: #999 !important;
		}

		@page {
			size: A4;
			margin: 12mm;
		}
	}
</style>
