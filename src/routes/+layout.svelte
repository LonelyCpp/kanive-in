<script>
	import NavbarMain from './components/nav/NavbarMain.svelte';

	let { children } = $props();
</script>

<NavbarMain />

<div class="body">
	<div class="container">
		{@render children()}
	</div>
</div>

<style>
	.body {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.container {
		display: flex;
		width: 100%;
		flex-direction: column;
		max-width: 720px;
	}
</style>
