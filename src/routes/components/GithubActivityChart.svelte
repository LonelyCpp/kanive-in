<script lang="ts">
	import type { GithubCalendar } from '$lib/github';

	let { calendar }: { calendar: GithubCalendar } = $props();

	function level(count: number) {
		if (count <= 0) return 0;
		if (count <= 2) return 1;
		if (count <= 5) return 2;
		if (count <= 9) return 3;
		return 4;
	}
</script>

<section aria-label="GitHub contribution activity">
	<div class="scroll">
		<div class="cells">
			{#each calendar.weeks as week, wi (wi)}
				{#each week as day (day.date)}
					<span class="cell l{level(day.count)}"></span>
				{/each}
			{/each}
		</div>
	</div>
</section>

<style>
	.scroll {
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.cells {
		--cell: 10px;
		--gap: 3px;
		--l0: #ececec;
		--l1: #c9cbcd;
		--l2: #9a9da1;
		--l3: #575b61;
		--l4: #1a1d23;

		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(7, var(--cell));
		grid-auto-columns: var(--cell);
		gap: var(--gap);
	}

	.cell {
		width: var(--cell);
		height: var(--cell);
		border-radius: 2px;
		background: var(--l0);
	}

	.cell.l1 {
		background: var(--l1);
	}
	.cell.l2 {
		background: var(--l2);
	}
	.cell.l3 {
		background: var(--l3);
	}
	.cell.l4 {
		background: var(--l4);
	}
</style>
