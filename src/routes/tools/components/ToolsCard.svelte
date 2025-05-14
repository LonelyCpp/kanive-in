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
	<a href={props.link} target="_blank"> Use </a>
</div>

<style>
	h3 {
		margin: 0;
	}

	.tools-card {
		background-color: #f4f4f8;
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	a {
		color: #6b6b6b;
		text-decoration: none;
		font-size: 0.9rem;
		border-bottom: 1px dotted #aaa;
		transition: all 0.2s ease;
		margin-top: 5px;
		display: inline-block;
	}

	a:hover {
		color: #444;
		border-bottom: 1px solid #888;
	}

	.description {
		color: #666;
		font-size: 0.9rem;
	}
</style>
