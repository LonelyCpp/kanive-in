<script>
	let link = '';
	let ofl = '';
	let utm_source = '';
	let utm_medium = '';
	let utm_campaign = '';
	let utm_content = '';
	let utm_term = '';
	let generatedLink = '';
	let errorMessage = '';

	function generateLink() {
		errorMessage = '';
		try {
			const baseURL = 'https://smallcase.page.link/';

			if (!link || !link.startsWith('https')) {
				throw new Error('link has to start with https://');
			}

			if (!ofl || !ofl.startsWith('https')) {
				throw new Error('fallback link has to start with https://');
			}

			const linkObj = new URL(link);
			const oflLinkObj = new URL(ofl);

			[linkObj, oflLinkObj].forEach((lk) => {
				lk.searchParams.set('utm_source', utm_source);
				lk.searchParams.set('utm_medium', utm_medium);
				lk.searchParams.set('utm_campaign', utm_campaign);
				lk.searchParams.set('utm_content', utm_content);
				lk.searchParams.set('utm_term', utm_term);
			});

			const params = new URLSearchParams({
				apn: 'com.smallcase.android',
				isi: '1345309437',
				ibi: 'com.smallcase.smallcaseIos',
				link: linkObj.toString(),
				ofl: oflLinkObj.toString(),
				utm_source,
				utm_medium,
				utm_campaign,
				utm_content,
				utm_term
			});

			generatedLink = `${baseURL}?${params.toString()}`;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
		}
	}

	function copyLink() {
		if (!generatedLink) return;
		navigator.clipboard.writeText(generatedLink);
	}
</script>

<svelte:head>
	<title>Firebase Link Generator</title>
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
		<button on:click={copyLink}>Copy Link</button>
	</div>

	{#if generatedLink}
		<p id="generated-link">{generatedLink}</p>
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
		margin-top: 10px;
		word-break: break-all;
	}

	.button-container {
		margin-top: 10px;
	}

	#error-message {
		color: red;
	}
</style>
