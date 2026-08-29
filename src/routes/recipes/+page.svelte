<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import PageWrapper from '../components/PageWrapper.svelte';
	import RecipeCard from './components/RecipeCard.svelte';
	import RecipeLightbox from './components/RecipeLightbox.svelte';
	import { recipes, type Recipe } from '$lib/data/recipes';

	const allTags = [...new Set(recipes.flatMap((recipe) => recipe.tags))].sort();

	const selectedTags = new SvelteSet<string>();

	const filtered = $derived(
		recipes.filter((recipe) => [...selectedTags].every((tag) => recipe.tags.includes(tag)))
	);

	let activeIndex = $state<number | null>(null);
	const activeRecipe = $derived(activeIndex === null ? null : (filtered[activeIndex] ?? null));

	function toggleTag(tag: string) {
		if (selectedTags.has(tag)) {
			selectedTags.delete(tag);
		} else {
			selectedTags.add(tag);
		}
	}

	function openAt(index: number) {
		activeIndex = index;
		history.replaceState(null, '', `#${filtered[index].slug}`);
	}

	function openRecipe(recipe: Recipe) {
		const index = filtered.indexOf(recipe);
		if (index !== -1) {
			openAt(index);
		}
	}

	function closeLightbox() {
		activeIndex = null;
		history.replaceState(null, '', location.pathname);
	}

	function step(delta: number) {
		if (activeIndex === null || filtered.length === 0) return;
		openAt((activeIndex + delta + filtered.length) % filtered.length);
	}

	$effect(() => {
		untrack(() => {
			const slug = location.hash.slice(1);
			const index = recipes.findIndex((recipe) => recipe.slug === slug);
			if (index !== -1) {
				const filteredIndex = filtered.indexOf(recipes[index]);
				if (filteredIndex !== -1) {
					activeIndex = filteredIndex;
				}
			}
		});
	});
</script>

<svelte:head>
	<title>Recipes</title>
</svelte:head>

<PageWrapper>
	<h1>Recipes</h1>
	<p>Handwritten recipes, pinned to the board</p>

	{#if allTags.length}
		<div class="filters">
			{#each allTags as tag (tag)}
				<button
					class="chip"
					class:active={selectedTags.has(tag)}
					onclick={() => toggleTag(tag)}
					aria-pressed={selectedTags.has(tag)}
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}

	{#if filtered.length}
		<div class="board">
			{#each filtered as recipe (recipe.slug)}
				<RecipeCard {recipe} onopen={openRecipe} />
			{/each}
		</div>
	{:else}
		<p class="empty">No recipes match the selected tags.</p>
	{/if}
</PageWrapper>

{#if activeRecipe}
	<RecipeLightbox
		recipe={activeRecipe}
		onclose={closeLightbox}
		onprev={() => step(-1)}
		onnext={() => step(1)}
	/>
{/if}

<style>
	h1 {
		margin-top: 48px;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 24px;
	}

	.chip {
		font: inherit;
		font-size: 13px;
		padding: 5px 14px;
		border-radius: 999px;
		border: 1px solid var(--on-surface-underline-color);
		background: transparent;
		color: var(--on-surface-color);
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.chip:hover {
		border-color: var(--on-surface-color);
	}

	.chip.active {
		background: var(--on-surface-color);
		border-color: var(--on-surface-color);
		color: var(--background-color);
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 28px 20px;
		margin-top: 40px;
	}

	.empty {
		margin-top: 40px;
		color: var(--on-surface-light-color);
	}

	@media screen and (max-width: 720px) {
		.board {
			grid-template-columns: repeat(2, 1fr);
			gap: 28px 16px;
		}

		/* Subtle divider under each card so a caption never runs into the next scan */
		.board :global(.card) {
			padding-bottom: 20px;
			border-bottom: 1px solid var(--on-surface-underline-color);
		}
	}
</style>
