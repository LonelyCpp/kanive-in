<script>
	import ArtCard from './components/ArtCard.svelte';
</script>

<div class="container">
	<h1>Art</h1>
	<p>Generative art that I've created</p>

	<div class="tools-container">
		<ArtCard title="Tree" link="/art/tree" />
	</div>
</div>

<style>
	.container {
		margin-top: 48px;
	}

	.tools-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 32px;
	}
</style>
