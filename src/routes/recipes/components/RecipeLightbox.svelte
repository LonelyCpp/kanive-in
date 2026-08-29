<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatRecipeDate, recipeImages, type Recipe } from '$lib/data/recipes';

	interface Props {
		recipe: Recipe;
		onclose: () => void;
		onprev: () => void;
		onnext: () => void;
	}

	let { recipe, onclose, onprev, onnext }: Props = $props();

	const images = $derived(recipeImages(recipe));

	const MAX_SCALE = 4;

	let viewport = $state<HTMLDivElement | null>(null);
	let dialog = $state<HTMLDivElement | null>(null);
	let imgEl = $state<HTMLImageElement | null>(null);

	let scale = $state(1);
	let page = $state(0);

	// Whole page visible is the default view. Once the user zooms manually,
	// load/resize events stop re-fitting until they return to the fitted state.
	let userZoomed = false;

	// Scale at which the scan's height exactly fills the image area. Zoom is
	// width-based (scale x 100% width), so fitting the height can mean going
	// below 1 (fit-width) — that becomes the zoom floor.
	let fitScale = $state(1);
	const minScale = $derived(Math.min(1, fitScale));

	const pointers = new Map<number, { x: number; y: number }>();
	let pinchStart: { dist: number; scale: number } | null = null;

	function computeFit() {
		if (!viewport || !imgEl || !imgEl.naturalHeight || !viewport.clientWidth) return;
		const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
		fitScale = (viewport.clientHeight / viewport.clientWidth) * ratio;
	}

	function applyDefault() {
		scale = minScale;
	}

	function refreshFit() {
		computeFit();
		if (!userZoomed) {
			applyDefault();
		}
	}

	$effect(() => {
		if (imgEl?.complete) {
			refreshFit();
		}
	});

	$effect(() => {
		window.addEventListener('resize', refreshFit);
		return () => window.removeEventListener('resize', refreshFit);
	});

	function clampScale(value: number): number {
		return Math.min(MAX_SCALE, Math.max(minScale, value));
	}

	function reset() {
		userZoomed = false;
		refreshFit();
	}

	$effect(() => {
		recipe;
		page = 0;
		reset();
	});

	$effect(() => {
		document.body.style.overflow = 'hidden';
		dialog?.focus();
		return () => {
			document.body.style.overflow = '';
		};
	});

	// Unmodified wheel is never intercepted — the browser scrolls/pans the scan
	// natively at any zoom. Only Ctrl/Cmd+wheel zooms (trackpad pinch emits
	// ctrlKey too, so pinch-zooming a trackpad just works).
	$effect(() => {
		const el = viewport;
		if (!el) return;
		function onWheel(event: WheelEvent) {
			if (!event.ctrlKey) return;
			event.preventDefault();
			zoomBy(event.deltaY < 0 ? 1.15 : 1 / 1.15);
		}
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	});

	$effect(() => {
		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onclose();
			} else if (event.key === 'ArrowLeft') {
				onprev();
			} else if (event.key === 'ArrowRight') {
				onnext();
			} else if (event.key === 'Tab' && dialog) {
				const focusables = dialog.querySelectorAll<HTMLElement>('button');
				if (!focusables.length) return;
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	// Touch: at 1x the browser pans natively (touch-action: pan-y). When zoomed
	// touch-action is none, so one finger drag-pans via scroll and two fingers
	// pinch-zoom here.
	function onPointerDown(event: PointerEvent) {
		viewport?.setPointerCapture(event.pointerId);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
		}
	}

	function onPointerMove(event: PointerEvent) {
		const previous = pointers.get(event.pointerId);
		if (!previous) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

		if (pointers.size === 2 && pinchStart) {
			const [a, b] = [...pointers.values()];
			const dist = Math.hypot(a.x - b.x, a.y - b.y);
			scale = clampScale(pinchStart.scale * (dist / pinchStart.dist));
			userZoomed = true;
			return;
		}

		if (pointers.size === 1 && scale > 1 && viewport) {
			viewport.scrollLeft -= event.clientX - previous.x;
			viewport.scrollTop -= event.clientY - previous.y;
		}
	}

	function onPointerUp(event: PointerEvent) {
		pointers.delete(event.pointerId);
		if (pointers.size < 2) {
			pinchStart = null;
		}
	}

	function onDoubleClick() {
		if (scale > minScale) {
			scale = minScale;
			userZoomed = false;
		} else {
			zoomBy(2.5);
		}
	}

	function zoomBy(factor: number) {
		scale = clampScale(scale * factor);
		userZoomed = true;
	}

	function goToPage(next: number) {
		page = Math.min(images.length - 1, Math.max(0, next));
		reset();
		viewport?.scrollTo({ top: 0 });
	}

	function fitToScreen() {
		computeFit();
		scale = clampScale(fitScale);
		userZoomed = true;
		viewport?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
	}
</script>

<div
	class="overlay"
	role="dialog"
	aria-modal="true"
	aria-label={`Recipe: ${recipe.title}`}
	tabindex="-1"
	bind:this={dialog}
>
	<header>
		<div class="meta">
			<h2>{recipe.title}</h2>
			{#if recipe.date}
				<span class="date">{formatRecipeDate(recipe.date)}</span>
			{/if}
		</div>
		<div class="actions">
			<button class="icon-button" aria-label="Fit recipe to screen" onclick={fitToScreen}>
				<Icon icon="mdi:fit-to-page-outline" font-size="24px" />
			</button>
			<button
				class="icon-button"
				aria-label="Zoom out"
				disabled={scale <= minScale}
				onclick={() => zoomBy(1 / 1.25)}
			>
				<Icon icon="mdi:magnify-minus-outline" font-size="24px" />
			</button>
			<button
				class="icon-button"
				aria-label="Zoom in"
				disabled={scale >= MAX_SCALE}
				onclick={() => zoomBy(1.25)}
			>
				<Icon icon="mdi:magnify-plus-outline" font-size="24px" />
			</button>
			<button class="icon-button" aria-label="Close recipe" onclick={onclose}>
				<Icon icon="mdi:close" font-size="26px" />
			</button>
		</div>
	</header>

	<div
		class="viewport"
		class:zoomed={scale > 1}
		role="presentation"
		bind:this={viewport}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		ondblclick={onDoubleClick}
	>
		<img
			bind:this={imgEl}
			onload={refreshFit}
			src={images[page]}
			alt={images.length > 1
				? `Handwritten recipe for ${recipe.title}, page ${page + 1}`
				: `Handwritten recipe for ${recipe.title}`}
			draggable="false"
			style:width={`${scale * 100}%`}
		/>
	</div>

	{#if images.length > 1}
		<div class="pager">
			<button
				class="icon-button small"
				aria-label="Previous page"
				disabled={page === 0}
				onclick={() => goToPage(page - 1)}
			>
				<Icon icon="mdi:chevron-left" font-size="20px" />
			</button>
			<span class="page-count">{page + 1} / {images.length}</span>
			<button
				class="icon-button small"
				aria-label="Next page"
				disabled={page === images.length - 1}
				onclick={() => goToPage(page + 1)}
			>
				<Icon icon="mdi:chevron-right" font-size="20px" />
			</button>
		</div>
	{/if}

	<button class="nav-button prev" aria-label="Previous recipe" onclick={onprev}>
		<Icon icon="mdi:chevron-left" font-size="34px" />
	</button>
	<button class="nav-button next" aria-label="Next recipe" onclick={onnext}>
		<Icon icon="mdi:chevron-right" font-size="34px" />
	</button>

	<footer>
		{#if recipe.note}
			<p class="note">{recipe.note}</p>
		{/if}
		{#if recipe.tags.length}
			<div class="tags">
				{#each recipe.tags as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		{/if}
	</footer>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overscroll-behavior: contain;
		background: rgba(18, 18, 20, 0.94);
		color: #f3f3f3;
		outline: none;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 20px;
		flex-shrink: 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.meta {
		display: flex;
		align-items: baseline;
		gap: 12px;
		min-width: 0;
	}

	h2 {
		margin: 0;
		font-size: 20px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.date {
		font-size: 13px;
		color: #b9b9bd;
		white-space: nowrap;
	}

	.icon-button,
	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		color: inherit;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.icon-button:hover,
	.nav-button:hover {
		background: rgba(255, 255, 255, 0.22);
	}

	.icon-button {
		width: 42px;
		height: 42px;
		flex-shrink: 0;
	}

	.icon-button.small {
		width: 32px;
		height: 32px;
	}

	.icon-button:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 8px 0 0;
		flex-shrink: 0;
	}

	.page-count {
		font-size: 13px;
		color: #b9b9bd;
		min-width: 42px;
		text-align: center;
	}

	/* Native scroll container: the scan is sized by width (scale x 100%), the
	   browser handles wheel/touch/scrollbar for panning at every zoom level. */
	.viewport {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		overflow: auto;
		overscroll-behavior: contain;
		touch-action: pan-y;
		cursor: zoom-in;
	}

	.viewport.zoomed {
		touch-action: none;
		cursor: grab;
	}

	.viewport img {
		margin: auto;
		user-select: none;
		-webkit-user-select: none;
	}

	.nav-button {
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		width: 48px;
		height: 48px;
		z-index: 1;
	}

	.nav-button.prev {
		left: 12px;
	}

	.nav-button.next {
		right: 12px;
	}

	footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 14px 56px 20px;
		flex-shrink: 0;
	}

	.note {
		margin: 0;
		font-size: 14px;
		color: #cfcfd4;
		text-align: center;
		max-width: 560px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}

	.tag {
		font-size: 12px;
		padding: 3px 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
		color: #dcdce0;
	}

	@media screen and (max-width: 720px) {
		.nav-button {
			width: 42px;
			height: 42px;
		}

		footer {
			padding: 12px 16px 16px;
		}
	}
</style>
