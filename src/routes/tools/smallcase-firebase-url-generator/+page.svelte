<script>
	import { onMount } from 'svelte';

	let link = '';
	let ofl = '';
	let utm_source = '';
	let utm_medium = '';
	let utm_campaign = '';
	let utm_content = '';
	let utm_term = '';
	let generatedFirebaseLink = '';
	let generatedAppsFlyerLink = '';
	let errorMessage = '';
	let af_template = '';

	const LOCAL_STORAGE_KEY = 'sc-link-form-values';

	// Save form values to localStorage
	function saveToLocalStorage() {
		try {
			const formValues = {
				link,
				ofl,
				utm_source,
				utm_medium,
				utm_campaign,
				utm_content,
				utm_term,
				af_template
			};
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formValues));
		} catch (error) {
			console.error('Error saving form values to localStorage:', error);
		}
	}

	// Load form values from localStorage
	function loadFromLocalStorage() {
		try {
			const savedValues = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (savedValues) {
				const formValues = JSON.parse(savedValues);
				link = formValues.link || '';
				ofl = formValues.ofl || '';
				utm_source = formValues.utm_source || '';
				utm_medium = formValues.utm_medium || '';
				utm_campaign = formValues.utm_campaign || '';
				utm_content = formValues.utm_content || '';
				utm_term = formValues.utm_term || '';
				af_template = formValues.af_template || '';
			}
		} catch (error) {
			console.error('Error loading form values from localStorage:', error);
		}
	}

	onMount(() => {
		loadFromLocalStorage();
	});

	function generateLink() {
		errorMessage = '';
		try {
			const baseURL = 'https://smallcase.page.link/';
			const appsFlyerBaseURL = 'https://go.smallcase.com/';

			if (!link || !link.startsWith('https')) {
				throw new Error('link has to start with https://');
			}

			if (!ofl || !ofl.startsWith('https')) {
				throw new Error('fallback link has to start with https://');
			}

			const baseFinalUrl = new URL(link);
			const baseFinalWebFallbackUrl = new URL(ofl);

			[baseFinalUrl, baseFinalWebFallbackUrl].forEach((lk) => {
				lk.searchParams.set('utm_source', utm_source);
				lk.searchParams.set('utm_medium', utm_medium);
				lk.searchParams.set('utm_campaign', utm_campaign);
				lk.searchParams.set('utm_content', utm_content);
				lk.searchParams.set('utm_term', utm_term);
			});

			const firebaseParams = new URLSearchParams({
				apn: 'com.smallcase.android',
				isi: '1345309437',
				ibi: 'com.smallcase.smallcaseIos',
				link: baseFinalUrl.toString(),
				ofl: baseFinalWebFallbackUrl.toString(),
				utm_source,
				utm_medium,
				utm_campaign,
				utm_content,
				utm_term
			});

			const appsFlyerParams = new URLSearchParams({
				deep_link_value: baseFinalUrl.toString(),
				af_dp: baseFinalUrl.toString(),
				af_web_dp: baseFinalWebFallbackUrl.toString(),
				af_xp: 'social',
				pid: utm_source,
				af_adset: utm_campaign,
				af_ad: utm_content,
				af_channel: utm_term,
				c: utm_medium
			});

			generatedFirebaseLink = new URL(`${baseURL}?${firebaseParams.toString()}`).toString();
			generatedAppsFlyerLink = new URL(
				`${appsFlyerBaseURL}${af_template}/?${appsFlyerParams.toString()}`
			).toString();

			saveToLocalStorage();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
		}
	}
</script>

<svelte:head>
	<title>Link Generator for smallcase apps</title>
	<meta name="description" content="Link Generator for smallcase apps" />
</svelte:head>

<div class="container">
	<h2>Link Generator</h2>

	<label>
		<span class="label-text"> Base Link: </span>
		<input
			type="url"
			bind:value={link}
			required
			placeholder="https://www.smallcase.com/smallcase/WRTNM_0001#intro-video"
		/>
	</label>
	<label>
		<span class="label-text"> Fallback Web Link: </span>
		<input
			type="url"
			bind:value={ofl}
			required
			placeholder="https://www.smallcase.com/smallcase/WRTNM_0001#intro-video"
		/>
	</label>
	<label>
		<span class="label-text"> AppsFlyer Template: </span>
		<input type="af-template" bind:value={af_template} required placeholder="gIQT" />
	</label>
	<label>
		<span class="label-text"> UTM Source: </span>
		<input type="text" bind:value={utm_source} placeholder="Enter utm_source" />
	</label>
	<label>
		<span class="label-text"> UTM Medium: </span>
		<input type="text" bind:value={utm_medium} placeholder="Enter utm_medium" />
	</label>
	<label>
		<span class="label-text"> UTM Campaign: </span>
		<input type="text" bind:value={utm_campaign} placeholder="Enter utm_campaign" />
	</label>
	<label>
		<span class="label-text"> UTM Content: </span>
		<input type="text" bind:value={utm_content} placeholder="Enter utm_content" />
	</label>
	<label>
		<span class="label-text"> UTM Term: </span>
		<input type="text" bind:value={utm_term} placeholder="Enter utm_term" />
	</label>

	<div class="button-container">
		<button on:click={generateLink}>Generate Link</button>
	</div>

	{#if generatedFirebaseLink}
		<p class="output-link-label">Firebase Link:</p>
		<p id="generated-link">
			{generatedFirebaseLink}
		</p>
	{/if}

	{#if generatedAppsFlyerLink}
		<p class="output-link-label">AppsFlyer Link:</p>
		<p id="generated-link">
			{generatedAppsFlyerLink}
		</p>
	{/if}

	{#if errorMessage}
		<p id="error-message">{errorMessage}</p>
	{/if}
</div>

<style>
	.container {
		margin-top: 48px;
	}

	input {
		display: block;
		margin-bottom: 10px;
		width: 100%;
		padding: 8px;
	}

	.label-text {
		font-size: 12px;
	}

	button {
		padding: 10px;
		margin-right: 5px;
		cursor: pointer;
	}
	#generated-link {
		font-style: italic;
		margin-top: 10px;
		word-break: break-all;
		font-weight: 100;
	}

	.button-container {
		margin-top: 10px;
	}

	.output-link-label {
		font-weight: bold;
		margin-top: 10px;
	}

	#error-message {
		color: red;
	}
</style>
