<script lang="ts">
	interface Props {
		title: string;
		link: string;
	}

	let props: Props = $props();
</script>

<a href={props.link}>
	<div class="tools-card">
		<h3>{props.title}</h3>
	</div>
</a>

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
		text-decoration: none;
	}
</style>
