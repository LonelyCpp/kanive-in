<script lang="ts">
	let urlInput = '';

	function parseURL(url: string) {
		try {
			return new URL(url);
		} catch (error) {
			return undefined;
		}
	}

	function getTableData(inp: URL) {
		return [
			{ name: 'Protocol', value: inp.protocol },
			{ name: 'Host', value: inp.host },
			{ name: 'Port', value: inp.port },
			{ name: 'Path', value: inp.pathname },
			{ name: 'Parameters', value: inp.search },
			{ name: 'Hash', value: inp.hash }
		];
	}

	function getQueyStringData(inp: URL) {
		const params = Object.fromEntries(inp.searchParams.entries());
		return Object.keys(params).map((key) => ({ name: key, value: params[key] }));
	}

	$: urlObject = parseURL(urlInput);
	$: urlPartsData = urlObject ? getTableData(urlObject) : [];
	$: queryPartsData = urlObject ? getQueyStringData(urlObject) : [];
</script>

<svelte:head>
	<title>URL Visualizer</title>
	<meta
		name="description"
		content="URLs (Uniform Resource Locators) are the building blocks of the web. This site helps you visualize and understand how they work."
	/>
</svelte:head>

<div>
	<div class="hero">
		<h1 class="title">See what's inside your web link</h1>
		<input type="text" class="url-input" bind:value={urlInput} />
		<div class="url-validity-badge">
			<span class="validity-badge">
				{#if urlObject}
					✅ Valid URL
				{:else if urlInput.length === 0}
					Enter a URL!
				{:else}
					❌ Invalid URL
				{/if}
			</span>
		</div>
	</div>

	{#if urlObject}
		<div class="url-content-container">
			<div class="table-container content-divider">
				<h3>Contents</h3>
				<table cellspacing="0">
					<thead>
						<tr>
							<th class="name-table-header">Name</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						{#each urlPartsData as part}
							<tr>
								<td>{part.name}</td>
								{#if part.value}
									<td>
										{part.value}
									</td>
								{:else}
									<td class="not-present">(not present)</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if queryPartsData?.length > 0}
				<div class="table-container content-divider">
					<h3>Parameters</h3>

					<table>
						<thead>
							<tr>
								<th class="name-table-header">Name</th>
								<th>Value</th>
							</tr>
						</thead>
						<tbody>
							{#each queryPartsData as part}
								<tr>
									<td>{part.name}</td>
									<td>{part.value}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 12px;
	}

	.url-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		min-width: 300px;
		font-size: large;
	}

	@media (max-width: 1000px) {
		.title {
			font-size: 2rem;
		}
	}

	.url-content-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.url-validity-badge {
		padding: 24px;
	}

	.table-container {
		width: 100%;
		min-width: 400px;
		overflow: scroll;
	}

	.content-divider {
		margin-bottom: 24px;
	}

	table {
		width: 100%;
	}

	thead {
		background-color: #d1dede;
	}

	th,
	td {
		border-collapse: collapse;
		text-align: left;
		padding: 0.5rem;
		max-width: 0px;
		overflow: scroll;
		white-space: nowrap;
	}

	td {
		background-color: #f1f1f1;
	}

	.name-table-header {
		width: 30%;
	}

	.not-present {
		opacity: 0.2;
	}
</style>
