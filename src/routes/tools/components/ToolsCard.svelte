<script lang="ts">
	interface Props {
		title: string;
		description: string;
		link: string;
	}

	let props: Props = $props();
</script>

<div class="tools-card">
	<h3>{props.title}</h3>
	<p class="description">{props.description}</p>
	<a href={props.link}> Use tool </a>
</div>

<style>
	h3 {
		margin: 0;
	}

	.tools-card {
		background-color: var(--surface-color);
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0 2px 5px var(--shadow-color);
	}

	a {
		color: var(--on-surface-light-color);
		text-decoration: none;
		font-size: 0.9rem;
		border-bottom: 1px dotted var(--on-surface-underline-color);
		transition: all 0.2s ease;
		margin-top: 5px;
		display: inline-block;
	}

	a:hover {
		color: var(--on-surface-color);
		border-bottom: 1px solid var(--on-surface-underline-color);
	}

	.description {
		color: var(--on-surface-light-color);
		font-size: 0.9rem;
	}
</style>
