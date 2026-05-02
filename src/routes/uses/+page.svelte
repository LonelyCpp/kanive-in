<script>
	import PageWrapper from '../components/PageWrapper.svelte';
</script>

<svelte:head>
	<title>Ananthu Uses</title>
	<meta name="description" content="Ananthu's uses page" />
</svelte:head>

<PageWrapper>
	<h1>Uses</h1>

	<h3>Hardware</h3>
	<ul>
		<li>MacBook Pro 16" (2021), M1 Pro</li>
		<li>Google Pixel 7 Pro</li>
	</ul>

	<h3>Software</h3>
	<ul>
		<li>ECMAScript / TypeScript</li>
		<li>React / React Native</li>
		<li>Cursor / VS Code</li>
		<li>Svelte</li>
		<li>Next.js</li>
		<li>Chrome</li>
	</ul>
</PageWrapper>

<style>
	h3 {
		margin: 0;
	}

	h1 {
		margin-top: 48px;
	}

	li {
		margin-bottom: 8px;
		color: var(--on-surface-light-color);
	}

	ul {
		margin-bottom: 16px;
	}
</style>
