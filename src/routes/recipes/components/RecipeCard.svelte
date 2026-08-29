<script lang="ts">
	import { formatRecipeDate, recipeImages, type Recipe } from '$lib/data/recipes';

	interface Props {
		recipe: Recipe;
		onopen: (recipe: Recipe) => void;
	}

	let { recipe, onopen }: Props = $props();

	function tiltFromSlug(slug: string): string {
		let hash = 0;
		for (let i = 0; i < slug.length; i++) {
			hash = (hash * 31 + slug.charCodeAt(i)) | 0;
		}
		const degrees = ((Math.abs(hash) % 31) / 10 - 1.5).toFixed(2);
		return `${degrees}deg`;
	}

	const tilt = tiltFromSlug(recipe.slug);
</script>

<button class="card" style:--tilt={tilt} onclick={() => onopen(recipe)}>
	<span class="pin" aria-hidden="true"></span>
	<div class="paper">
		<img
			src={recipeImages(recipe)[0]}
			alt={`Handwritten recipe for ${recipe.title}`}
			loading="lazy"
		/>
	</div>
	<div class="caption">
		<span class="title">{recipe.title}</span>
		{#if recipe.date}
			<span class="date">{formatRecipeDate(recipe.date)}</span>
		{/if}
	</div>
	{#if recipe.tags.length}
		<div class="tags">
			{#each recipe.tags as tag (tag)}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	{/if}
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		position: relative;
		text-align: left;
		font: inherit;
		color: inherit;
		transform: rotate(var(--tilt));
		transition:
			transform 0.2s ease,
			filter 0.2s ease;
	}

	.card:hover,
	.card:focus-visible {
		transform: rotate(0deg) translateY(-4px);
	}

	.pin {
		position: absolute;
		top: 6px;
		left: 50%;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #e57373, #c62828);
		box-shadow: 0 2px 3px rgba(0, 0, 0, 0.3);
		z-index: 1;
	}

	.paper {
		background: #fffdf6;
		padding: 12px;
		border-radius: 3px;
		box-shadow: 0 2px 6px var(--shadow-color);
		transition: box-shadow 0.2s ease;
	}

	.card:hover .paper,
	.card:focus-visible .paper {
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
	}

	.paper img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: contain;
		border-radius: 2px;
	}

	.caption {
		display: flex;
		flex-direction: column;
		padding: 0 4px;
	}

	.title {
		font-weight: bold;
		font-size: 15px;
	}

	.date {
		font-size: 12px;
		color: var(--on-surface-light-color);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 0 4px;
	}

	.tag {
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--surface-color);
		color: var(--on-surface-light-color);
		box-shadow: inset 0 0 0 1px var(--on-surface-underline-color);
	}
</style>
