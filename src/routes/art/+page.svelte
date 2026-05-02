<script>
	import ArtCard from './components/ArtCard.svelte';
	import PageWrapper from '../components/PageWrapper.svelte';
</script>

<PageWrapper>
	<h1>Art</h1>
	<p>Generative art that I've created</p>

	<div class="tools-container">
		<ArtCard title="Tree" link="/art/tree" />
		<ArtCard title="Pi" link="/art/monte-carlo-pi" />
	</div>
</PageWrapper>

<style>
	h1 {
		margin-top: 48px;
	}

	.tools-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 32px;
	}
</style>
