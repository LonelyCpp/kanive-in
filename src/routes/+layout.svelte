<script>
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	import NavbarMain from './components/nav/NavbarMain.svelte';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();
</script>

<div class="main dark">
	<NavbarMain />

	<div class="body">
		<div class="container">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.main {
		--background-color: #f9f9f9;
		--on-background-color: #1a1d23;
		--surface-color: #f4f2f3;
		--on-surface-color: #1a1d23;
		--on-surface-light-color: #525252;
		--on-surface-underline-color: #aaa;
		--shadow-color: rgba(0, 0, 0, 0.1);

		background-color: var(--background-color);
		color: var(--on-background-color);
		height: 100%;
		padding: 12px;
	}

	.body {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--background-color);
	}

	.container {
		display: flex;
		width: 100%;
		height: 100%;
		flex-direction: column;
		max-width: 720px;
		margin-bottom: 32px;
	}
</style>
