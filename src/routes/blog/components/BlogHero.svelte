<script lang="ts">
	let { title, subtitle } = $props();
</script>

<div class="hero">
	<h1 class="title">{title}</h1>
	<p class="subtitle">{subtitle}</p>
</div>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 260px;

		@media (max-width: 720px) {
			height: 160px;
		}
	}

	.title {
		color: var(--on-background-color);
		font-size: 3rem;
		line-height: 0;
	}

	.subtitle {
		font-size: 0.8rem;
		line-height: 0;
		color: var(--on-surface-light-color);
	}
</style>
