<script>
	import NavbarMain from './components/nav/NavbarMain.svelte';

	let { children } = $props();
</script>

<NavbarMain />

{@render children()}

<style>
	:global(body) {
		font-family:
			'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
	}
</style>
